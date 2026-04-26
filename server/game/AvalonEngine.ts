import { Server, Socket, Namespace } from "socket.io";
import {
  AvalonRoom,
  AvalonRole,
  AvalonSkillDecision,
  AvalonSkillType,
  AvalonVoteOutcome,
} from "./AvalonTypes";

export class AvalonEngine {
  private rooms: Map<string, AvalonRoom> = new Map();
  private io: Namespace;
  private voteOutcomeTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private chatRateLimits: Map<string, number[]> = new Map();
  private questResolutionTimers: Map<string, ReturnType<typeof setTimeout>[]> =
    new Map();

  private getQuestHistoryByPlayerCount(playerCount: number) {
    const questSizeMap: Record<number, number[]> = {
      5: [2, 3, 2, 3, 3],
      6: [2, 3, 4, 3, 4],
      7: [2, 3, 3, 4, 4],
      8: [3, 4, 4, 5, 5],
      9: [3, 4, 4, 5, 5],
      10: [3, 4, 4, 5, 5],
    };

    const safePlayerCount = Math.max(5, Math.min(10, playerCount));
    const teamSizes = questSizeMap[safePlayerCount] ?? questSizeMap[5];

    return teamSizes.map((teamSize, index) => {
      const isFourthQuest = index === 3;
      const failsRequired = isFourthQuest && safePlayerCount >= 7 ? 2 : 1;
      return { teamSize, failsRequired, status: "pending" as const };
    });
  }

  private getNextLeaderIndex(room: AvalonRoom, currentIndex: number) {
    if (room.players.length === 0) return 0;

    for (let step = 1; step <= room.players.length; step++) {
      const idx = (currentIndex + step) % room.players.length;
      const candidate = room.players[idx];
      if (
        candidate &&
        candidate.status === "connected" &&
        !candidate.isSpectator
      ) {
        return idx;
      }
    }

    for (let step = 1; step <= room.players.length; step++) {
      const idx = (currentIndex + step) % room.players.length;
      const candidate = room.players[idx];
      if (candidate && !candidate.isSpectator) {
        return idx;
      }
    }

    return currentIndex;
  }

  private clearQuestResolutionTimers(roomId: string) {
    const timers = this.questResolutionTimers.get(roomId);
    if (!timers) return;
    timers.forEach((timer) => clearTimeout(timer));
    this.questResolutionTimers.delete(roomId);
  }

  private scheduleQuestResolutionTimer(
    roomId: string,
    callback: () => void,
    delayMs: number,
  ) {
    const timer = setTimeout(() => {
      callback();
      const timers = this.questResolutionTimers.get(roomId);
      if (!timers) return;
      const next = timers.filter((t) => t !== timer);
      if (next.length === 0) {
        this.questResolutionTimers.delete(roomId);
      } else {
        this.questResolutionTimers.set(roomId, next);
      }
    }, delayMs);

    const existing = this.questResolutionTimers.get(roomId) ?? [];
    existing.push(timer);
    this.questResolutionTimers.set(roomId, existing);
  }

  private addSystemMessage(room: AvalonRoom, text: string) {
    room.messages.push({
      senderId: "system",
      senderName: "Hệ thống",
      text,
      timestamp: Date.now(),
    });
    if (room.messages.length > 50) room.messages.shift();
  }

  private addPrivateNotice(room: AvalonRoom, userId: string, text: string) {
    if (!room.privateNoticesByUserId) room.privateNoticesByUserId = {};
    const list = room.privateNoticesByUserId[userId] ?? [];
    list.push(text);
    room.privateNoticesByUserId[userId] = list.slice(-5);
  }

  private ensureSkillUsageHistory(room: AvalonRoom) {
    if (!room.skillUsageHistory) room.skillUsageHistory = [];
  }

  private recordSkillUsage(
    room: AvalonRoom,
    params: {
      phase: "quest" | "preAssassination";
      questNumber: number | null;
      actorUserId: string;
      skillType: AvalonSkillType;
      targetUserId?: string | null;
      detail?: string;
    },
  ) {
    if (params.skillType === "none") return;

    this.ensureSkillUsageHistory(room);

    const actor = room.players.find((p) => p.userId === params.actorUserId);
    const target = params.targetUserId
      ? room.players.find((p) => p.userId === params.targetUserId)
      : undefined;

    room.skillUsageHistory!.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phase: params.phase,
      questNumber: params.questNumber,
      actorUserId: params.actorUserId,
      actorName: actor?.name ?? "Ẩn danh",
      skillType: params.skillType,
      targetUserId: target?.userId ?? null,
      targetName: target?.name ?? null,
      detail: params.detail,
      createdAt: Date.now(),
    });

    if (room.skillUsageHistory!.length > 80) {
      room.skillUsageHistory = room.skillUsageHistory!.slice(-80);
    }
  }

  private getSkillTypeForRole(
    role: AvalonRole | undefined,
    advancedMode: boolean,
  ): AvalonSkillType {
    if (!advancedMode || !role) return "none";

    switch (role) {
      case "Merlin":
        return "merlinEternalBond";
      case "Assassin":
        return "assassinInsight";
      case "Morgana":
        return "morganaSilence";
      case "Mordred":
        return "mordredForceFail";
      case "Athena":
        return "athenaFateFlip";
      case "Percival":
        return "percivalTrace";
      case "Minion_Evil":
      case "Minion_Good":
        return "minionChaCha";
      default:
        return "none";
    }
  }

  private getSkillTypeForPlayer(
    room: AvalonRoom,
    userId: string,
  ): AvalonSkillType {
    const player = room.players.find((p) => p.userId === userId);
    return this.getSkillTypeForRole(player?.role, room.settings.advancedMode);
  }

  private skillRequiresTarget(skillType: AvalonSkillType): boolean {
    return (
      skillType === "assassinInsight" ||
      skillType === "percivalTrace" ||
      skillType === "mordredForceFail"
    );
  }

  private isSkillReusableEachQuest(skillType: AvalonSkillType): boolean {
    return skillType === "minionChaCha";
  }

  private getQuestSkillParticipantUserIds(room: AvalonRoom): string[] {
    const participantSet = new Set(room.proposedTeam);
    const mordred = room.players.find(
      (p) => p.role === "Mordred" && !p.isSpectator && p.status === "connected",
    );
    if (mordred) {
      participantSet.add(mordred.userId);
    }
    return Array.from(participantSet);
  }

  private canUseSkillInCurrentQuest(room: AvalonRoom, userId: string): boolean {
    const skillType = this.getSkillTypeForPlayer(room, userId);
    if (skillType === "none") return false;
    if (skillType === "merlinEternalBond") return false;
    if (this.isSkillReusableEachQuest(skillType)) return true;
    return !Boolean(room.skillUsedByUserId?.[userId]);
  }

  private canUseMerlinPreAssassinationSkill(
    room: AvalonRoom,
    userId: string,
  ): boolean {
    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator || player.role !== "Merlin") return false;
    const skillType = this.getSkillTypeForPlayer(room, userId);
    if (skillType !== "merlinEternalBond") return false;
    return !Boolean(room.skillUsedByUserId?.[userId]);
  }

  private ensureSkillUsageMap(room: AvalonRoom) {
    if (!room.skillUsedByUserId) room.skillUsedByUserId = {};
    room.players
      .filter((p) => !p.isSpectator)
      .forEach((p) => {
        if (
          room.skillUsedByUserId &&
          room.skillUsedByUserId[p.userId] == null
        ) {
          room.skillUsedByUserId[p.userId] = false;
        }
      });
  }

  private getPercivalFunctionVisibility(role: AvalonRole | undefined): boolean {
    if (!role) return false;
    return (
      role !== "Minion_Evil" &&
      role !== "Minion_Good" &&
      role !== "Mordred" &&
      role !== "Oberon"
    );
  }

  private getRoleHasActiveFunction(role: AvalonRole | undefined): boolean {
    if (!role) return false;
    return (
      role !== "Minion_Evil" &&
      role !== "Minion_Good" &&
      role !== "Mordred" &&
      role !== "Oberon"
    );
  }

  private revealRolePublicly(room: AvalonRoom, userId: string) {
    if (!room.publicRevealedRoleUserIds) room.publicRevealedRoleUserIds = [];
    if (!room.publicRevealedRoleUserIds.includes(userId)) {
      room.publicRevealedRoleUserIds.push(userId);
    }
  }

  private beginSkillDecisionPhase(room: AvalonRoom) {
    const participantUserIds = this.getQuestSkillParticipantUserIds(room);

    room.state = "SKILL_DECISION";
    room.skillDecisionState = {
      questNumber: room.currentQuestIndex + 1,
      phase: "quest",
      participantUserIds,
      decisions: {},
      submittedCount: 0,
      publicAnnouncements: [],
    };
    room.players.forEach((p) => {
      p.hasVoted = false;
      delete p.questVote;
    });

    // Auto-confirm players with no usable skill in this quest (e.g., Merlin), so
    // they are not forced to interact with a no-skill decision step.
    room.skillDecisionState.participantUserIds.forEach((participantUserId) => {
      const participant = room.players.find(
        (p) => p.userId === participantUserId,
      );
      if (!participant || participant.isSpectator) {
        room.skillDecisionState!.decisions[participantUserId] = {
          userId: participantUserId,
          skillType: "none",
          useSkill: false,
          targetUserId: null,
          submittedAt: Date.now(),
        };
        if (participant) participant.hasVoted = true;
        return;
      }

      const skillType = this.getSkillTypeForPlayer(room, participantUserId);
      const canUseSkill = this.canUseSkillInCurrentQuest(
        room,
        participantUserId,
      );

      if (!canUseSkill) {
        room.skillDecisionState!.decisions[participantUserId] = {
          userId: participantUserId,
          skillType,
          useSkill: false,
          targetUserId: null,
          submittedAt: Date.now(),
        };
        participant.hasVoted = true;
      }
    });

    room.skillDecisionState.submittedCount = Object.keys(
      room.skillDecisionState.decisions,
    ).length;
  }

  private beginMerlinPreAssassinationDecisionPhase(
    room: AvalonRoom,
  ): AvalonRoom["skillDecisionState"] {
    const merlin = room.players.find(
      (p) => p.role === "Merlin" && !p.isSpectator && p.status === "connected",
    );

    if (!room.settings.advancedMode || !merlin) {
      room.state = "ASSASSINATION";
      return room.skillDecisionState ?? null;
    }

    this.ensureSkillUsageMap(room);

    room.state = "SKILL_DECISION";
    room.skillDecisionState = {
      questNumber: room.currentQuestIndex,
      phase: "preAssassination",
      participantUserIds: [merlin.userId],
      decisions: {},
      submittedCount: 0,
      publicAnnouncements: [],
    };

    room.players.forEach((p) => {
      p.hasVoted = false;
      delete p.questVote;
    });

    const canUseSkill = this.canUseMerlinPreAssassinationSkill(
      room,
      merlin.userId,
    );
    if (!canUseSkill) {
      room.skillDecisionState.decisions[merlin.userId] = {
        userId: merlin.userId,
        skillType: this.getSkillTypeForPlayer(room, merlin.userId),
        useSkill: false,
        targetUserId: null,
        submittedAt: Date.now(),
      };
      merlin.hasVoted = true;
      room.skillDecisionState.submittedCount = 1;
    }

    return room.skillDecisionState;
  }

  constructor(server: Server) {
    this.io = server.of("/avalon");
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Avalon client connected:", socket.id);

      socket.on(
        "checkRoom",
        (roomId: string, callback: (exists: boolean) => void) => {
          if (typeof callback === "function") {
            callback(this.rooms.has(roomId));
          }
        },
      );

      socket.on(
        "createRoom",
        (roomId: string, callback: (success: boolean) => void) => {
          if (this.rooms.has(roomId)) {
            if (typeof callback === "function") callback(false);
          } else {
            this.createRoom(roomId);
            if (typeof callback === "function") callback(true);
          }
        },
      );

      socket.on("joinRoom", ({ roomId, playerName, userId, avatarUrl }) => {
        if (!userId) return;
        this.joinRoom(
          roomId,
          { id: socket.id, userId, name: playerName, avatarUrl },
          socket,
        );
        socket.data.roomId = roomId;
        socket.data.userId = userId;
      });

      socket.on("disconnect", () => {
        console.log("Avalon client disconnected:", socket.id);
        if (socket.data.roomId) {
          this.leaveRoom(socket.data.roomId, socket.id);
        }
      });

      socket.on("chatMessage", (text: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.chatMessage(socket.data.roomId, socket.data.userId, text);
        }
      });

      socket.on("updateSettings", (settings) => {
        if (socket.data.roomId && socket.data.userId) {
          this.updateSettings(socket.data.roomId, socket.data.userId, settings);
        }
      });

      socket.on("startAvalonGame", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.startAvalonGame(socket.data.roomId, socket.id);
        }
      });

      socket.on("playerReady", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.playerReady(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("toggleTeamSelection", (targetId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.toggleTeamSelection(
            socket.data.roomId,
            socket.data.userId,
            targetId,
          );
        }
      });

      socket.on("submitTeam", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.submitTeam(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("voteTeam", (vote: "approve" | "reject") => {
        if (socket.data.roomId && socket.data.userId) {
          this.voteTeam(socket.data.roomId, socket.data.userId, vote);
        }
      });

      socket.on("voteQuest", (vote: "success" | "fail") => {
        if (socket.data.roomId && socket.data.userId) {
          this.voteQuest(socket.data.roomId, socket.data.userId, vote);
        }
      });

      socket.on(
        "submitSkillDecision",
        (payload?: { useSkill?: boolean; targetUserId?: string | null }) => {
          if (socket.data.roomId && socket.data.userId) {
            this.submitSkillDecision(
              socket.data.roomId,
              socket.data.userId,
              payload,
            );
          }
        },
      );

      socket.on("assassinate", (targetId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.assassinate(socket.data.roomId, socket.data.userId, targetId);
        }
      });

      socket.on("suggestAssassinationTarget", (targetId: string | null) => {
        if (!socket.data.roomId || !socket.data.userId) return;
        const room = this.rooms.get(socket.data.roomId);
        if (!room || room.state !== "ASSASSINATION") return;
        const player = room.players.find(
          (p) => p.userId === socket.data.userId,
        );
        if (!player || player.isSpectator || player.team !== "Evil") return;
        if (!room.assassinationSuggestions) room.assassinationSuggestions = {};
        room.assassinationSuggestions[socket.data.userId] = targetId;
        this.broadcastState(socket.data.roomId);
      });

      socket.on("restartAvalonGame", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.restartAvalonGame(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("returnToLobby", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.restartAvalonGame(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("voteEarlyEnd", (accept: boolean) => {
        if (socket.data.roomId && socket.data.userId) {
          this.voteEarlyEnd(socket.data.roomId, socket.data.userId, accept);
        }
      });

      socket.on("reorderPlayers", (orderedUserIds: string[]) => {
        if (socket.data.roomId && socket.data.userId) {
          this.reorderPlayers(
            socket.data.roomId,
            socket.data.userId,
            orderedUserIds,
          );
        }
      });

      socket.on("transferHost", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.transferHost(
            socket.data.roomId,
            socket.data.userId,
            targetUserId,
          );
        }
      });

      socket.on("changeName", (newName: string) => {
        if (
          socket.data.roomId &&
          socket.data.userId &&
          typeof newName === "string"
        ) {
          this.changeName(
            socket.data.roomId,
            socket.data.userId,
            newName.trim().slice(0, 12),
          );
        }
      });

      socket.on("updateAvatar", (avatarUrl: string | null) => {
        if (socket.data.roomId && socket.data.userId) {
          this.updateAvatar(socket.data.roomId, socket.data.userId, avatarUrl);
        }
      });

      socket.on("toggleRaiseHand", (isRaised?: boolean) => {
        if (socket.data.roomId && socket.data.userId) {
          this.toggleRaiseHand(
            socket.data.roomId,
            socket.data.userId,
            isRaised,
          );
        }
      });

      socket.on("toggleSpectatorLobby", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.toggleSpectatorLobby(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on(
        "measurePing",
        (timestamp: number, callback: (ts: number) => void) => {
          if (typeof callback === "function") {
            callback(timestamp);
          }
        },
      );

      socket.on("updatePing", (userId: string, ping: number) => {
        if (socket.data.roomId && userId) {
          socket.to(socket.data.roomId).emit("playerPing", userId, ping);
        }
      });
    });
  }

  private createRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: [],
        state: "LOBBY",
        settings: {
          advancedMode: false,
          merlin: true,
          percival: true,
          assassin: true,
          morgana: true,
          mordred: false,
          oberon: false,
          leaderSeesDetailedVoteCounts: true,
          showQuestParticipantsBoard: true,
        },
        messages: [],
        questHistory: this.getQuestHistoryByPlayerCount(5),
        questParticipantsHistory: [],
        currentQuestIndex: 0,
        voteTrack: 0,
        proposedTeam: [],
        leaderIndex: 0,
        votingResults: null,
        voteOutcome: null,
        skillDecisionState: null,
        skillUsedByUserId: {},
        skillUsageHistory: [],
        functionTagByViewerUserId: {},
        merlinBondArmedUserId: null,
        forcedFailState: null,
        privateNoticesByUserId: {},
        publicRevealedRoleUserIds: [],
      });
    }
  }

  private clearVoteOutcomeTimer(roomId: string) {
    const existingTimer = this.voteOutcomeTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.voteOutcomeTimers.delete(roomId);
    }
  }

  private setVoteOutcome(
    roomId: string,
    room: AvalonRoom,
    outcome: Omit<AvalonVoteOutcome, "id" | "createdAt">,
  ) {
    this.clearVoteOutcomeTimer(roomId);

    room.voteOutcome = {
      ...outcome,
      id: Date.now(),
      createdAt: Date.now(),
    };
  }

  public joinRoom(
    roomId: string,
    pData: { id: string; userId: string; name: string; avatarUrl?: string },
    socket: Socket,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit(
        "avalonError",
        "Phòng Hội Yến không tồn tại hoặc đã bị giải tán!",
      );
      return;
    }

    const room = this.rooms.get(roomId)!;

    const existingPlayer = room.players.find((p) => p.userId === pData.userId);
    if (existingPlayer) {
      // Reconnect logic — keep existing role/team/spectator status
      existingPlayer.id = pData.id;
      existingPlayer.name = pData.name;
      if (pData.avatarUrl !== undefined) existingPlayer.avatarUrl = pData.avatarUrl;
      existingPlayer.status = "connected";

      // In LOBBY: if this player lost host (e.g. disconnected earlier), push to bottom
      if (room.state === "LOBBY" && !existingPlayer.isHost) {
        const idx = room.players.indexOf(existingPlayer);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          room.players.push(existingPlayer);
        }
      }
    } else {
      // Brand new player
      const isHost = room.players.length === 0;
      const isMidGame = room.state !== "LOBBY";
      room.players.push({
        id: pData.id,
        userId: pData.userId,
        name: pData.name,
        avatarUrl: pData.avatarUrl,
        isHost: isHost && !isMidGame, // don't give host to mid-game joiners
        status: "connected",
        isHandRaised: false,
        ...(isMidGame ? { isSpectator: true } : {}),
      });
    }

    socket.join(roomId);
    this.broadcastState(roomId);
  }

  public leaveRoom(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const pIndex = room.players.findIndex((p) => p.id === socketId);
    if (pIndex !== -1) {
      const player = room.players[pIndex];
      player.status = "disconnected";

      // Spectators can be safely removed anytime — they don't affect game indices
      // In LOBBY, all players can be safely removed
      const canRemove = room.state === "LOBBY" || player.isSpectator;
      if (canRemove) {
        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          this.clearQuestResolutionTimers(roomId);
          this.rooms.delete(roomId);
        } else if (player.isHost) {
          // Shift host to first remaining connected non-spectator, or first player
          const newHost =
            room.players.find(
              (p) => p.status === "connected" && !p.isSpectator,
            ) ?? room.players[0];
          newHost.isHost = true;
        }
      }
      // Active players mid-game: keep in array as disconnected to preserve indices

      this.broadcastState(roomId);
    }
  }

  public chatMessage(roomId: string, userId: string, text: string) {
    if (!text || text.length > 500) return;

    const now = Date.now();
    let userStamps = this.chatRateLimits.get(userId) || [];
    userStamps = userStamps.filter((time) => now - time < 10000);

    if (userStamps.length >= 10) return; // Rate limit exceeded: max 10 messages per 10s

    userStamps.push(now);
    this.chatRateLimits.set(userId, userStamps);

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      room.messages.push({
        senderId: player.userId,
        senderName: player.name,
        text,
        timestamp: Date.now(),
      });
      if (room.messages.length > 50) room.messages.shift();
      this.broadcastState(roomId);
    }
  }

  public updateSettings(
    roomId: string,
    userId: string,
    settings: Partial<AvalonRoom["settings"]>,
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = room.players.find((p) => p.userId === userId);
    if (player && player.isHost) {
      room.settings = { ...room.settings, ...settings };
      this.broadcastState(roomId);
    }
  }

  public startAvalonGame(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const host = room.players.find((p) => p.id === socketId);
    if (!host || !host.isHost) return;

    const activePlayers = room.players.filter(
      (p) => p.status === "connected" && !p.isSpectator,
    );
    const numPlayers = activePlayers.length;
    if (numPlayers < 5 || numPlayers > 10) return;

    room.questHistory = this.getQuestHistoryByPlayerCount(numPlayers);
    room.questParticipantsHistory = [];
    room.currentQuestIndex = 0;
    room.voteTrack = 0;
    room.proposedTeam = [];
    room.votingResults = null;
    room.skillDecisionState = null;
    room.forcedFailState = null;
    room.privateNoticesByUserId = {};
    room.skillUsedByUserId = {};
    room.skillUsageHistory = [];
    room.publicRevealedRoleUserIds = [];
    delete room.minionSoulmates;
    this.clearQuestResolutionTimers(roomId);
    room.players.forEach((p) => {
      p.isHandRaised = false;
      if (room.skillUsedByUserId) {
        room.skillUsedByUserId[p.userId] = false;
      }
    });

    // Determine counts based on standard Avalon rules
    const counts: Record<number, { good: number; evil: number }> = {
      5: { good: 3, evil: 2 },
      6: { good: 4, evil: 2 },
      7: { good: 4, evil: 3 },
      8: { good: 5, evil: 3 },
      9: { good: 6, evil: 3 },
      10: { good: 6, evil: 4 },
    };

    const split = counts[numPlayers];
    if (!split) return;
    const goodLimit = split.good;
    const evilLimit = split.evil;

    const settings = room.settings;

    const evilRoles: AvalonRole[] = [];
    const goodRoles: AvalonRole[] = [];

    // Fill Evil pool in priority order, then pad with generic minions.
    if (settings.assassin && evilRoles.length < evilLimit)
      evilRoles.push("Assassin");
    if (settings.morgana && evilRoles.length < evilLimit)
      evilRoles.push("Morgana");
    if (settings.mordred && evilRoles.length < evilLimit)
      evilRoles.push("Mordred");
    if (settings.oberon && evilRoles.length < evilLimit)
      evilRoles.push("Oberon");
    while (evilRoles.length < evilLimit) {
      evilRoles.push("Minion_Evil");
    }

    // Fill Good pool in priority order, then pad with generic servants.
    if (settings.merlin && goodRoles.length < goodLimit)
      goodRoles.push("Merlin");
    if (settings.percival && goodRoles.length < goodLimit)
      goodRoles.push("Percival");
    if (
      settings.advancedMode &&
      numPlayers >= 7 &&
      goodRoles.length < goodLimit
    )
      goodRoles.push("Athena");
    while (goodRoles.length < goodLimit) {
      goodRoles.push("Minion_Good");
    }

    const roles: AvalonRole[] = [...evilRoles, ...goodRoles];
    if (roles.length !== numPlayers) return;

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign
    const evilRoleSet = new Set<AvalonRole>([
      "Assassin",
      "Morgana",
      "Mordred",
      "Oberon",
      "Minion_Evil",
      "Evil Lancelot",
    ]);
    activePlayers.forEach((p, i) => {
      p.role = roles[i];
      p.team = evilRoleSet.has(roles[i]) ? "Evil" : "Good";
      p.isReady = false; // Reset ready state
    });

    // Leader = host (the host or whoever was transferred host is the first leader)
    const hostIndex = room.players.findIndex((p) => p.isHost);
    room.leaderIndex = hostIndex >= 0 ? hostIndex : 0;

    room.state = "ROLE_REVEAL";
    this.broadcastState(roomId);
  }

  public playerReady(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "ROLE_REVEAL") return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator) return;

    player.isReady = true;

    // Check if everyone connected (non-spectator) is ready
    const allReady = room.players
      .filter((p) => p.status === "connected" && !p.isSpectator)
      .every((p) => p.isReady);
    if (allReady) {
      room.state = "TEAM_BUILDING";
    }

    this.broadcastState(roomId);
  }

  public toggleTeamSelection(roomId: string, userId: string, targetId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "TEAM_BUILDING") return;

    const actor = room.players.find((p) => p.userId === userId);
    if (!actor || actor.isSpectator) return;

    // Only leader can select
    const leader = room.players[room.leaderIndex];
    if (!leader || leader.userId !== userId || leader.isSpectator) return;

    const maxTeamSize = room.questHistory[room.currentQuestIndex].teamSize;

    const index = room.proposedTeam.indexOf(targetId);
    if (index > -1) {
      room.proposedTeam.splice(index, 1);
    } else {
      if (room.proposedTeam.length < maxTeamSize) {
        room.proposedTeam.push(targetId);
      }
    }
    this.broadcastState(roomId);
  }

  public submitTeam(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "TEAM_BUILDING") return;

    const actor = room.players.find((p) => p.userId === userId);
    if (!actor || actor.isSpectator) return;

    const leader = room.players[room.leaderIndex];
    if (!leader || leader.userId !== userId || leader.isSpectator) return;

    const maxTeamSize = room.questHistory[room.currentQuestIndex].teamSize;
    if (room.proposedTeam.length !== maxTeamSize) return;

    room.state = "VOTING";
    room.votingResults = {};
    room.players.forEach((p) => (p.hasVoted = false));
    this.broadcastState(roomId);
  }

  public voteTeam(roomId: string, userId: string, vote: "approve" | "reject") {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "VOTING" || !room.votingResults) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator) return;

    room.votingResults[userId] = vote;
    player.hasVoted = true;

    // Check if everyone voted (non-spectator)
    const activePlayers = room.players.filter(
      (p) => p.status === "connected" && !p.isSpectator,
    );
    const allVoted = activePlayers.every((p) => p.hasVoted);

    if (allVoted) {
      let approves = 0;
      let rejects = 0;
      activePlayers.forEach((p) => {
        if (room.votingResults![p.userId] === "approve") approves++;
        else rejects++;
      });

      if (approves > rejects) {
        // Team approved
        const leader = room.players[room.leaderIndex];
        this.setVoteOutcome(roomId, room, {
          kind: "team",
          result: "approve",
          leaderUserId: leader?.userId ?? userId,
          revealDetailedCountsToLeader:
            room.settings.leaderSeesDetailedVoteCounts,
          approveCount: approves,
          rejectCount: rejects,
          totalVotes: activePlayers.length,
        });

        room.voteTrack = 0;
        if (room.settings.advancedMode) {
          this.ensureSkillUsageMap(room);
          this.beginSkillDecisionPhase(room);

          const allAutoSubmitted =
            !!room.skillDecisionState &&
            room.skillDecisionState.submittedCount >=
              room.skillDecisionState.participantUserIds.length;
          if (allAutoSubmitted) {
            this.resolveSkillDecisionPhase(roomId, room);
            return;
          }
        } else {
          room.state = "QUEST";
          room.players.forEach((p) => {
            p.hasVoted = false;
            delete p.questVote;
          });
        }
      } else {
        // Team rejected
        const leader = room.players[room.leaderIndex];
        this.setVoteOutcome(roomId, room, {
          kind: "team",
          result: "reject",
          leaderUserId: leader?.userId ?? userId,
          revealDetailedCountsToLeader:
            room.settings.leaderSeesDetailedVoteCounts,
          approveCount: approves,
          rejectCount: rejects,
          totalVotes: activePlayers.length,
        });

        room.voteTrack++;
        if (room.voteTrack >= 5) {
          room.state = "GAME_OVER";
          // Automatically Evil wins if 5 tracks reached. Can extend later.
        } else {
          // Pass leader
          room.leaderIndex = this.getNextLeaderIndex(room, room.leaderIndex);
          room.proposedTeam = [];
          room.state = "TEAM_BUILDING";
        }
      }
    }
    this.broadcastState(roomId);
  }

  public submitSkillDecision(
    roomId: string,
    userId: string,
    payload?: { useSkill?: boolean; targetUserId?: string | null },
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "SKILL_DECISION" || !room.skillDecisionState)
      return;
    if (!room.skillDecisionState.participantUserIds.includes(userId)) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator || player.hasVoted) return;

    this.ensureSkillUsageMap(room);

    const skillType = this.getSkillTypeForPlayer(room, userId);
    const canUseSkill =
      room.skillDecisionState.phase === "preAssassination"
        ? this.canUseMerlinPreAssassinationSkill(room, userId)
        : this.canUseSkillInCurrentQuest(room, userId);

    const requestedUse = Boolean(payload?.useSkill) && canUseSkill;
    let targetUserId = payload?.targetUserId ?? null;

    if (requestedUse && this.skillRequiresTarget(skillType)) {
      const isValidTarget =
        !!targetUserId &&
        room.proposedTeam.includes(targetUserId) &&
        targetUserId !== userId;
      if (!isValidTarget) {
        targetUserId = null;
      }
    } else {
      targetUserId = null;
    }

    const useSkill =
      requestedUse &&
      (!this.skillRequiresTarget(skillType) || Boolean(targetUserId));

    const decision: AvalonSkillDecision = {
      userId,
      skillType,
      useSkill,
      targetUserId,
      submittedAt: Date.now(),
    };

    room.skillDecisionState.decisions[userId] = decision;
    room.skillDecisionState.submittedCount = Object.keys(
      room.skillDecisionState.decisions,
    ).length;

    player.hasVoted = true;

    const allSubmitted =
      room.skillDecisionState.submittedCount >=
      room.skillDecisionState.participantUserIds.length;

    if (allSubmitted) {
      this.resolveSkillDecisionPhase(roomId, room);
      return;
    }

    this.broadcastState(roomId);
  }

  private resolveSkillDecisionPhase(roomId: string, room: AvalonRoom) {
    const skillState = room.skillDecisionState;
    if (!skillState) return;

    if (skillState.phase === "preAssassination") {
      this.resolveMerlinPreAssassinationDecision(roomId, room);
      return;
    }

    this.ensureSkillUsageMap(room);
    const functionTagByViewerUserId =
      room.functionTagByViewerUserId ?? (room.functionTagByViewerUserId = {});

    const decisions = Object.values(skillState.decisions);
    const playersById = new Map(room.players.map((p) => [p.userId, p]));

    const morganaDecision = decisions.find(
      (decision) =>
        decision.useSkill && decision.skillType === "morganaSilence",
    );

    const morganaSilenced = Boolean(morganaDecision);
    skillState.morganaSilenced = morganaSilenced;

    if (morganaDecision && room.skillUsedByUserId) {
      room.skillUsedByUserId[morganaDecision.userId] = true;
      this.addPrivateNotice(
        room,
        morganaDecision.userId,
        "Bạn đã kích hoạt Đêm Câm Lặng. Toàn bộ kỹ năng quest này bị khóa.",
      );
      this.recordSkillUsage(room, {
        phase: "quest",
        questNumber: skillState.questNumber,
        actorUserId: morganaDecision.userId,
        skillType: "morganaSilence",
        detail: "Khóa toàn bộ kỹ năng trong phase này.",
      });
    }

    let athenaActivatorUserId: string | undefined;
    let mordredForceTargetUserId: string | undefined;

    if (!morganaSilenced) {
      decisions.forEach((decision) => {
        if (!decision.useSkill || !room.skillUsedByUserId) return;

        const actor = playersById.get(decision.userId);
        if (!actor) return;

        switch (decision.skillType) {
          case "mordredForceFail": {
            if (!decision.targetUserId) return;
            const target = playersById.get(decision.targetUserId);
            if (!target) return;
            room.skillUsedByUserId[actor.userId] = true;
            mordredForceTargetUserId = target.userId;
            room.forcedFailState = {
              questNumber: room.currentQuestIndex + 1,
              targetUserId: target.userId,
              sourceUserId: actor.userId,
            };
            skillState.mordredForceTargetUserId = target.userId;
            this.addPrivateNotice(
              room,
              target.userId,
              "Bạn đang bị nguyền: ở lượt vote nhiệm vụ này, phiếu của bạn sẽ bị ép thành FAIL.",
            );
            this.recordSkillUsage(room, {
              phase: "quest",
              questNumber: skillState.questNumber,
              actorUserId: actor.userId,
              skillType: "mordredForceFail",
              targetUserId: target.userId,
              detail: "Ép mục tiêu bỏ phiếu FAIL khi đi nhiệm vụ.",
            });
            break;
          }

          case "athenaFateFlip": {
            athenaActivatorUserId = actor.userId;
            skillState.athenaActivatorUserId = actor.userId;
            room.skillUsedByUserId[actor.userId] = true;
            this.revealRolePublicly(room, actor.userId);
            this.addPrivateNotice(
              room,
              actor.userId,
              "Athena đã sẵn sàng đảo ngược số phận sau khi quest kết toán.",
            );
            this.recordSkillUsage(room, {
              phase: "quest",
              questNumber: skillState.questNumber,
              actorUserId: actor.userId,
              skillType: "athenaFateFlip",
              detail: "Đảo ngược kết quả nhiệm vụ sau khi lật bài.",
            });
            break;
          }

          case "minionChaCha": {
            // Do not announce in public chat to avoid exposing Minion identity
            if (!skillState.successfulChaChaUserIds) {
              skillState.successfulChaChaUserIds = [];
            }
            skillState.successfulChaChaUserIds.push(actor.userId);
            this.recordSkillUsage(room, {
              phase: "quest",
              questNumber: skillState.questNumber,
              actorUserId: actor.userId,
              skillType: "minionChaCha",
              detail: "Kích hoạt liên kết Minion.",
            });
            break;
          }

          case "assassinInsight": {
            if (!decision.targetUserId) return;
            const target = playersById.get(decision.targetUserId);
            if (!target) return;
            room.skillUsedByUserId[actor.userId] = true;
            const hasFunction = this.getRoleHasActiveFunction(target.role);
            const insightLine = `Soi ${target.name}: ${hasFunction ? "CÓ CHỨC NĂNG" : "KHÔNG CÓ CHỨC NĂNG"}.`;
            const actorFunctionTags =
              functionTagByViewerUserId[actor.userId] ??
              (functionTagByViewerUserId[actor.userId] = {});
            actorFunctionTags[target.userId] = hasFunction
              ? "hasFunction"
              : "noFunction";
            this.addPrivateNotice(room, actor.userId, insightLine);
            this.recordSkillUsage(room, {
              phase: "quest",
              questNumber: skillState.questNumber,
              actorUserId: actor.userId,
              skillType: "assassinInsight",
              targetUserId: target.userId,
              detail: hasFunction
                ? "Kết quả soi: CÓ CHỨC NĂNG."
                : "Kết quả soi: KHÔNG CÓ CHỨC NĂNG.",
            });
            break;
          }

          case "percivalTrace": {
            if (!decision.targetUserId) return;
            const target = playersById.get(decision.targetUserId);
            if (!target) return;
            room.skillUsedByUserId[actor.userId] = true;
            const hasFunction = this.getPercivalFunctionVisibility(target.role);
            const traceLine = `Truy vết ${target.name}: ${hasFunction ? "CÓ CHỨC NĂNG" : "KHÔNG CÓ CHỨC NĂNG"}.`;
            const actorFunctionTags =
              functionTagByViewerUserId[actor.userId] ??
              (functionTagByViewerUserId[actor.userId] = {});
            actorFunctionTags[target.userId] = hasFunction
              ? "hasFunction"
              : "noFunction";
            this.addPrivateNotice(room, actor.userId, traceLine);
            this.recordSkillUsage(room, {
              phase: "quest",
              questNumber: skillState.questNumber,
              actorUserId: actor.userId,
              skillType: "percivalTrace",
              targetUserId: target.userId,
              detail: hasFunction
                ? "Kết quả truy vết: CÓ CHỨC NĂNG."
                : "Kết quả truy vết: KHÔNG CÓ CHỨC NĂNG.",
            });
            break;
          }

          case "merlinEternalBond": {
            break;
          }

          default:
            break;
        }
      });
    }

    if (!mordredForceTargetUserId) {
      room.forcedFailState = null;
    }

    if (!athenaActivatorUserId) {
      skillState.athenaActivatorUserId = undefined;
    }

    room.state = "QUEST";
    room.players.forEach((p) => {
      p.hasVoted = false;
      delete p.questVote;
    });

    this.broadcastState(roomId);
  }

  private resolveMerlinPreAssassinationDecision(
    roomId: string,
    room: AvalonRoom,
  ) {
    const skillState = room.skillDecisionState;
    if (!skillState || skillState.phase !== "preAssassination") return;

    this.ensureSkillUsageMap(room);

    const merlinUserId = skillState.participantUserIds[0];
    const merlinDecision = merlinUserId
      ? skillState.decisions[merlinUserId]
      : undefined;

    if (
      merlinUserId &&
      merlinDecision?.useSkill &&
      merlinDecision.skillType === "merlinEternalBond" &&
      room.skillUsedByUserId
    ) {
      room.skillUsedByUserId[merlinUserId] = true;
      room.merlinBondArmedUserId = merlinUserId;
      this.addPrivateNotice(
        room,
        merlinUserId,
        "Bạn đã kích hoạt Đồng Quy Vô Tận. Nếu bị ám sát trúng, trận đấu sẽ hòa.",
      );
      this.recordSkillUsage(room, {
        phase: "preAssassination",
        questNumber: null,
        actorUserId: merlinUserId,
        skillType: "merlinEternalBond",
        detail: "Kích hoạt đồng quy trước phase ám sát.",
      });
    } else {
      room.merlinBondArmedUserId = null;
    }

    room.skillDecisionState = null;
    room.state = "ASSASSINATION";
    room.players.forEach((p) => {
      p.hasVoted = false;
      delete p.questVote;
    });

    this.broadcastState(roomId);
  }

  public voteQuest(roomId: string, userId: string, vote: "success" | "fail") {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "QUEST") return;

    // Only proposed team can vote
    if (!room.proposedTeam.includes(userId)) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator || player.hasVoted) return;

    player.questVote = vote;
    player.hasVoted = true;

    const teamPlayers = room.players.filter((p) =>
      room.proposedTeam.includes(p.userId),
    );
    const allVoted = teamPlayers.every((p) => p.hasVoted);

    if (!allVoted) {
      this.broadcastState(roomId);
      return;
    }

    const questNumber = room.currentQuestIndex + 1;
    const forcedTarget =
      room.forcedFailState?.questNumber === questNumber
        ? room.forcedFailState.targetUserId
        : undefined;

    const votes = teamPlayers.map((p) =>
      forcedTarget && p.userId === forcedTarget ? "fail" : p.questVote!,
    );

    const failCount = votes.filter((v) => v === "fail").length;
    const successCount = votes.length - failCount;
    const requiredFails =
      room.questHistory[room.currentQuestIndex].failsRequired;
    const rawResult = failCount >= requiredFails ? "fail" : "success";
    const leaderUserId = room.players[room.leaderIndex]?.userId ?? userId;

    const currentQuest = room.questHistory[room.currentQuestIndex];
    currentQuest.votes = votes;
    room.questParticipantsHistory = [
      ...room.questParticipantsHistory.filter(
        (record) => record.questNumber !== questNumber,
      ),
      {
        questNumber,
        participantUserIds: [...room.proposedTeam],
      },
    ].sort((a, b) => a.questNumber - b.questNumber);

    const athenaActivatorUserId =
      room.skillDecisionState?.athenaActivatorUserId;
    const athenaFlipActive =
      room.settings.advancedMode &&
      Boolean(athenaActivatorUserId) &&
      !Boolean(room.skillDecisionState?.morganaSilenced);

    const finalResult = athenaFlipActive
      ? rawResult === "success"
        ? "fail"
        : "success"
      : rawResult;

    room.players.forEach((p) => {
      p.hasVoted = false;
      delete p.questVote;
    });

    if (!athenaFlipActive) {
      this.setVoteOutcome(roomId, room, {
        kind: "quest",
        result: finalResult,
        leaderUserId,
        revealDetailedCountsToLeader:
          room.settings.leaderSeesDetailedVoteCounts,
        failCount,
        successCount,
        totalVotes: votes.length,
        questNumber,
      });
      this.finalizeQuestOutcome(roomId, room, finalResult);
      return;
    }

    room.state = "QUEST_RESOLUTION";
    this.clearQuestResolutionTimers(roomId);

    const ATHENA_FLIP_REVEAL_DELAY_MS = 3000;
    const ATHENA_CINEMATIC_DURATION_MS = 8000;

    this.setVoteOutcome(roomId, room, {
      kind: "quest",
      result: rawResult,
      leaderUserId,
      revealDetailedCountsToLeader: room.settings.leaderSeesDetailedVoteCounts,
      failCount,
      successCount,
      totalVotes: votes.length,
      questNumber,
      athenaFlip: true,
      athenaStage: "raw",
      athenaRawResult: rawResult,
      athenaFinalResult: finalResult,
    });

    this.broadcastState(roomId);

    this.scheduleQuestResolutionTimer(
      roomId,
      () => {
        const liveRoom = this.rooms.get(roomId);
        if (!liveRoom || liveRoom.currentQuestIndex + 1 !== questNumber) return;

        const athena = liveRoom.players.find(
          (p) => p.userId === athenaActivatorUserId,
        );
        if (athena) {
          this.addSystemMessage(
            liveRoom,
            `${athena.name} đã kích hoạt Athena: số phận nhiệm vụ bị đảo ngược!`,
          );
        }

        this.setVoteOutcome(roomId, liveRoom, {
          kind: "quest",
          result: finalResult,
          leaderUserId,
          revealDetailedCountsToLeader:
            liveRoom.settings.leaderSeesDetailedVoteCounts,
          failCount,
          successCount,
          totalVotes: votes.length,
          questNumber,
          athenaFlip: true,
          athenaStage: "flipped",
          athenaRawResult: rawResult,
          athenaFinalResult: finalResult,
          announcement: "Athena đã đảo ngược số phận nhiệm vụ.",
        });

        this.broadcastState(roomId);
      },
      ATHENA_FLIP_REVEAL_DELAY_MS,
    );

    this.scheduleQuestResolutionTimer(
      roomId,
      () => {
        const liveRoom = this.rooms.get(roomId);
        if (!liveRoom || liveRoom.currentQuestIndex + 1 !== questNumber) return;
        this.finalizeQuestOutcome(roomId, liveRoom, finalResult);
      },
      ATHENA_FLIP_REVEAL_DELAY_MS + ATHENA_CINEMATIC_DURATION_MS,
    );
  }

  private finalizeQuestOutcome(
    roomId: string,
    room: AvalonRoom,
    finalResult: "success" | "fail",
  ) {
    const currentQuest = room.questHistory[room.currentQuestIndex];
    if (currentQuest) {
      currentQuest.status = finalResult;
    }

    room.proposedTeam = [];
    room.leaderIndex = this.getNextLeaderIndex(room, room.leaderIndex);
    room.currentQuestIndex++;
    room.skillDecisionState = null;
    room.forcedFailState = null;

    // Evaluate Minion connection (advanced mode only)
    if (room.settings.advancedMode && !room.minionSoulmates) {
      const minions = room.players.filter(p => !p.isSpectator && (p.role === "Minion_Good" || p.role === "Minion_Evil"));
      const eligibleMinions = new Set<string>();

      for (let i = 0; i < minions.length; i++) {
        for (let j = i + 1; j < minions.length; j++) {
          const m1 = minions[i];
          const m2 = minions[j];
          let sharedQuests = 0;
          let sharedSuccesses = 0;
          
          room.questParticipantsHistory.forEach(record => {
            const inTeam = record.participantUserIds.includes(m1.userId) && record.participantUserIds.includes(m2.userId);
            if (inTeam) {
              sharedQuests++;
              const questStatus = room.questHistory[record.questNumber - 1]?.status;
              if (questStatus === "success") {
                sharedSuccesses++;
              }
            }
          });

          if (sharedQuests >= 3 && sharedSuccesses >= 2) {
            eligibleMinions.add(m1.userId);
            eligibleMinions.add(m2.userId);
          }
        }
      }

      const eligibleArray = Array.from(eligibleMinions);
      if (eligibleArray.length >= 2) {
        // Shuffle to pick random 2
        for (let i = eligibleArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [eligibleArray[i], eligibleArray[j]] = [eligibleArray[j], eligibleArray[i]];
        }
        room.minionSoulmates = [eligibleArray[0], eligibleArray[1]];
        
        const name1 = room.players.find(p => p.userId === eligibleArray[0])?.name || "Đồng đội";
        const name2 = room.players.find(p => p.userId === eligibleArray[1])?.name || "Đồng đội";
        
        this.addPrivateNotice(room, eligibleArray[0], `Tín hiệu siêu linh: Bạn đã nhận ra đồng phạm Minion của mình là ${name2}!`);
        this.addPrivateNotice(room, eligibleArray[1], `Tín hiệu siêu linh: Bạn đã nhận ra đồng phạm Minion của mình là ${name1}!`);
      }
    }

    const successes = room.questHistory.filter(
      (q) => q.status === "success",
    ).length;
    const fails = room.questHistory.filter((q) => q.status === "fail").length;

    if (successes >= 3) {
      const assassinExists = room.players.some((p) => p.role === "Assassin");
      if (assassinExists) {
        const decisionState = this.beginMerlinPreAssassinationDecisionPhase(room);

        const decisionSubmittedCount = decisionState?.submittedCount ?? 0;
        const decisionParticipantCount =
          decisionState?.participantUserIds.length ?? 0;
        const merlinDecisionAutoCompleted =
          room.state === "SKILL_DECISION" &&
          decisionParticipantCount > 0 &&
          decisionSubmittedCount >= decisionParticipantCount;

        if (merlinDecisionAutoCompleted) {
          this.resolveSkillDecisionPhase(roomId, room);
          return;
        }
      } else {
        room.state = "GAME_OVER";
        room.winner = "Good";
      }
    } else if (fails >= 3) {
      room.state = "GAME_OVER";
      room.winner = "Evil";
    } else {
      room.state = "TEAM_BUILDING";
    }

    this.broadcastState(roomId);
  }

  public assassinate(roomId: string, userId: string, targetId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "ASSASSINATION") return;

    const assassin = room.players.find((p) => p.userId === userId);
    if (!assassin || assassin.isSpectator || assassin.role !== "Assassin")
      return;

    const target = room.players.find((p) => p.userId === targetId);
    if (!target) return;

    room.assassinationTarget = targetId;
    room.state = "GAME_OVER";

    if (target.role === "Merlin") {
      room.winner =
        room.merlinBondArmedUserId === target.userId ? "Abandoned" : "Evil";
    } else {
      room.winner = "Good"; // Assassin missed
    }

    this.broadcastState(roomId);
  }

  public restartAvalonGame(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || !player.isHost) return;

    // --- Determine next host BEFORE roles are cleared ---
    // Priority: Mordred ván trước → Merlin (luôn có) → giữ nguyên host
    const connectedPlayers = room.players.filter(
      (p) => p.status === "connected",
    );
    const nextHostCandidate =
      connectedPlayers.find((p) => p.role === "Mordred") ??
      connectedPlayers.find((p) => p.role === "Merlin") ??
      null;

    // Reset room state to lobby
    room.state = "LOBBY";

    // Purge disconnected players (they can rejoin fresh)
    room.players = room.players.filter((p) => p.status === "connected");

    const connectedCount = room.players.length;
    room.questHistory = this.getQuestHistoryByPlayerCount(
      connectedCount >= 5 ? connectedCount : 5,
    );
    room.questParticipantsHistory = [];
    room.currentQuestIndex = 0;
    room.voteTrack = 0;
    room.proposedTeam = [];
    room.votingResults = null;
    room.voteOutcome = null;
    room.skillDecisionState = null;
    room.skillUsedByUserId = {};
    room.skillUsageHistory = [];
    room.functionTagByViewerUserId = {};
    room.privateFunctionTagByTargetUserId = {};
    room.merlinBondArmedUserId = null;
    room.forcedFailState = null;
    room.privateNoticesByUserId = {};
    room.publicRevealedRoleUserIds = [];
    delete room.winner;
    delete room.assassinationTarget;
    delete room.assassinationSuggestions;
    delete room.minionSoulmates;

    this.clearVoteOutcomeTimer(roomId);
    this.clearQuestResolutionTimers(roomId);

    // Promote spectators to regular players, reset all game fields
    room.players.forEach((p) => {
      delete p.role;
      delete p.team;
      delete p.hasVoted;
      delete p.currentVote;
      delete p.questVote;
      delete p.isHandRaised;
      p.isReady = false;
    });

    // Apply next-host transfer if a valid candidate was found and still connected
    if (nextHostCandidate) {
      const newHost = room.players.find(
        (p) => p.userId === nextHostCandidate.userId,
      );
      if (newHost) {
        room.players.forEach((p) => {
          p.isHost = false;
        });
        newHost.isHost = true;
      }
    }

    // Clear early end votes too
    room.earlyEndVotes = [];

    this.broadcastState(roomId);
  }

  public voteEarlyEnd(roomId: string, userId: string, accept: boolean) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "LOBBY" || room.state === "GAME_OVER") return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator) return;

    if (!room.earlyEndVotes) {
      room.earlyEndVotes = [];
    }

    if (!accept) {
      // If ANY player declines, the vote is cancelled entirely for everyone
      room.earlyEndVotes = [];
    } else {
      if (!room.earlyEndVotes.includes(userId)) {
        room.earlyEndVotes.push(userId);
      }

      // Check if all connected playing players have voted yes
      const activePlayers = room.players.filter(
        (p) => p.status === "connected" && !p.isSpectator,
      );
      if (
        room.earlyEndVotes.length >= activePlayers.length &&
        activePlayers.length > 0
      ) {
        // Everyone agreed to end the game early
        room.state = "GAME_OVER";
        room.winner = "Abandoned";
        room.earlyEndVotes = [];
      }
    }

    this.broadcastState(roomId);
  }

  public reorderPlayers(
    roomId: string,
    userId: string,
    orderedUserIds: string[],
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || !player.isHost) return;

    // Validate: orderedUserIds must contain exactly all current player userIds
    const currentIds = new Set(room.players.map((p) => p.userId));
    if (orderedUserIds.length !== currentIds.size) return;
    if (!orderedUserIds.every((id) => currentIds.has(id))) return;

    // Reorder the players array
    const playerMap = new Map(room.players.map((p) => [p.userId, p]));
    room.players = orderedUserIds.map((id) => playerMap.get(id)!);

    this.broadcastState(roomId);
  }

  public transferHost(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const currentHost = room.players.find((p) => p.userId === userId);
    if (!currentHost || !currentHost.isHost) return;

    const newHost = room.players.find((p) => p.userId === targetUserId);
    if (!newHost || newHost.userId === currentHost.userId) return;
    if (newHost.status !== "connected") return;
    if (newHost.isSpectator) return; // spectator cannot become host

    currentHost.isHost = false;
    newHost.isHost = true;

    this.broadcastState(roomId);
  }

  public changeName(roomId: string, userId: string, newName: string) {
    if (!newName) return;
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.name = newName;
      this.broadcastState(roomId);
    }
  }

  public updateAvatar(roomId: string, userId: string, avatarUrl: string | null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.avatarUrl = avatarUrl ?? undefined;
      this.broadcastState(roomId);
    }
  }

  public toggleRaiseHand(roomId: string, userId: string, isRaised?: boolean) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "LOBBY" || room.state === "GAME_OVER") return;

    const player = room.players.find(
      (p) => p.userId === userId && p.status === "connected",
    );
    if (!player) return;

    player.isHandRaised =
      typeof isRaised === "boolean" ? isRaised : !Boolean(player.isHandRaised);
    this.broadcastState(roomId);
  }

  // Toggle spectator in LOBBY — player can opt in/out before game starts
  public toggleSpectatorLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = room.players.find(
      (p) => p.userId === userId && p.status === "connected",
    );
    if (!player || player.isHost) return; // host can't become spectator in lobby

    player.isSpectator = !player.isSpectator;
    this.broadcastState(roomId);
  }

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Create safe payload to prevent sending the secret roles of other players!
      // But we must do it specific per-player, so we emit to each connected socket individually.
      room.players.forEach((p) => {
        if (p.status === "connected") {
          const safeRoomState = this.getSafeStateForPlayer(room, p.userId);
          this.io.to(p.id).emit("avalonGameState", safeRoomState);
        }
      });
    }
  }

  private getSafeStateForPlayer(room: AvalonRoom, userId: string) {
    const clone = JSON.parse(JSON.stringify(room)) as AvalonRoom;
    const me = clone.players.find((p) => p.userId === userId);

    if (!me) return clone;

    clone.privateNotices = clone.privateNoticesByUserId?.[userId] ?? [];
    delete clone.privateNoticesByUserId;

    clone.privateFunctionTagByTargetUserId =
      clone.functionTagByViewerUserId?.[userId] ?? {};
    delete clone.functionTagByViewerUserId;

    if (
      clone.forcedFailState &&
      clone.forcedFailState.targetUserId !== me.userId
    ) {
      delete clone.forcedFailState;
    }

    if (clone.skillDecisionState) {
      const myDecision = clone.skillDecisionState.decisions[me.userId];
      clone.skillDecisionState.decisions = myDecision
        ? { [me.userId]: myDecision }
        : {};
    }

    if (clone.state !== "GAME_OVER") {
      delete clone.skillUsageHistory;
    }

    if (clone.state === "SKILL_DECISION") {
      clone.players.forEach((p) => {
        if (p.userId !== me.userId) {
          delete p.hasVoted;
        }
      });
    }

    // In Lobby, Assassination phase, and Game Over, roles are public for table UX.
    if (
      clone.state === "LOBBY" ||
      clone.state === "ASSASSINATION" ||
      clone.state === "GAME_OVER"
    ) {
      return clone;
    }

    if (clone.voteOutcome) {
      const canSeeDetailedCounts =
        clone.voteOutcome.revealDetailedCountsToLeader &&
        clone.voteOutcome.leaderUserId === me.userId;

      if (!canSeeDetailedCounts) {
        delete clone.voteOutcome.approveCount;
        delete clone.voteOutcome.rejectCount;
        delete clone.voteOutcome.failCount;
        delete clone.voteOutcome.successCount;
        delete clone.voteOutcome.totalVotes;
      }
    }

    if (!clone.settings.showQuestParticipantsBoard) {
      clone.questParticipantsHistory = [];
    }

    // Obfuscate secret roles for security
    const revealedRoleUserIds = new Set(clone.publicRevealedRoleUserIds ?? []);
    clone.players.forEach((p) => {
      if (p.userId !== me.userId) {
        let seeAsSpecificRole = false;
        let seeAsGenericEvil = false;
        let seeAsMerlinLike = false; // Seen by Percival

        if (revealedRoleUserIds.has(p.userId)) {
          delete p.questVote;
          return;
        }

        // Evil sees other Evil (except Oberon)
        if (me.team === "Evil" && me.role !== "Oberon") {
          if (p.team === "Evil" && p.role !== "Oberon") {
            seeAsSpecificRole = true;
          }
        }

        // Athena sees Merlin directly
        if (me.role === "Athena" && p.role === "Merlin") {
          seeAsSpecificRole = true;
        }

        // Merlin sees Evil (except Mordred)
        if (me.role === "Merlin") {
          if (p.team === "Evil" && p.role !== "Mordred") {
            seeAsGenericEvil = true;
          }
        }

        // Percival always sees Merlin and Morgana as the same "Merlin-like" signal.
        if (me.role === "Percival") {
          if (p.role === "Merlin" || p.role === "Morgana") {
            seeAsMerlinLike = true;
          }
        }

        // Obfuscate quest votes until revealed? Not strictly needed for payload if we clear them,
        // but we shouldn't send individual questVotes.
        delete p.questVote;

        // Soulmate Minion vision 
        if (clone.minionSoulmates && clone.minionSoulmates.includes(me.userId) && clone.minionSoulmates.includes(p.userId)) {
          seeAsSpecificRole = true;
        }

        // Apply obfuscation
        if (!seeAsSpecificRole && !seeAsGenericEvil && !seeAsMerlinLike) {
          delete p.role;
          delete p.team;
        } else if (seeAsSpecificRole) {
          // The user wants Evil companions to see EACH OTHER's exact roles
          // So we do not delete p.role, we leave it intact.
        } else if (seeAsGenericEvil) {
          // Normal Merlin vision (does not know EXACT evil role usually, just that they are evil)
          delete p.role;
          p.team = "Evil";
        } else if (seeAsMerlinLike) {
          // Percival's view
          delete p.team;
          p.role = "Merlin"; // Both Merlin and Morgana look the same to Percival
        }
      }
    });
    return clone;
  }
}
