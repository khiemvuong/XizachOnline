import { Server, Socket, Namespace } from "socket.io";
import { AvalonRoom, AvalonRole, AvalonVoteOutcome } from "./AvalonTypes";

export class AvalonEngine {
  private rooms: Map<string, AvalonRoom> = new Map();
  private io: Namespace;
  private voteOutcomeTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private chatRateLimits: Map<string, number[]> = new Map();

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

      socket.on("joinRoom", ({ roomId, playerName, userId }) => {
        if (!userId) return;
        this.joinRoom(
          roomId,
          { id: socket.id, userId, name: playerName },
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
    pData: { id: string; userId: string; name: string },
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
    room.players.forEach((p) => {
      p.isHandRaised = false;
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
        room.state = "QUEST";
        room.players.forEach((p) => (p.hasVoted = false)); // reset for quest voting
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

  public voteQuest(roomId: string, userId: string, vote: "success" | "fail") {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "QUEST") return;

    // Only proposed team can vote
    if (!room.proposedTeam.includes(userId)) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.isSpectator) return;

    player.questVote = vote;
    player.hasVoted = true;

    const teamPlayers = room.players.filter((p) =>
      room.proposedTeam.includes(p.userId),
    );
    const allVoted = teamPlayers.every((p) => p.hasVoted);

    if (allVoted) {
      const votes = teamPlayers.map((p) => p.questVote!);
      const failCount = votes.filter((v) => v === "fail").length;
      const successCount = votes.length - failCount;
      const requiredFails =
        room.questHistory[room.currentQuestIndex].failsRequired;
      const questNumber = room.currentQuestIndex + 1;

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

      if (failCount >= requiredFails) {
        currentQuest.status = "fail";
        this.setVoteOutcome(roomId, room, {
          kind: "quest",
          result: "fail",
          leaderUserId: room.players[room.leaderIndex]?.userId ?? userId,
          revealDetailedCountsToLeader:
            room.settings.leaderSeesDetailedVoteCounts,
          failCount,
          successCount,
          totalVotes: votes.length,
          questNumber,
        });
      } else {
        currentQuest.status = "success";
        this.setVoteOutcome(roomId, room, {
          kind: "quest",
          result: "success",
          leaderUserId: room.players[room.leaderIndex]?.userId ?? userId,
          revealDetailedCountsToLeader:
            room.settings.leaderSeesDetailedVoteCounts,
          failCount,
          successCount,
          totalVotes: votes.length,
          questNumber,
        });
      }

      // Reset for next
      room.players.forEach((p) => {
        p.hasVoted = false;
        delete p.questVote;
      });
      room.proposedTeam = [];
      room.leaderIndex = this.getNextLeaderIndex(room, room.leaderIndex);

      room.currentQuestIndex++;

      // Check game over
      const successes = room.questHistory.filter(
        (q) => q.status === "success",
      ).length;
      const fails = room.questHistory.filter((q) => q.status === "fail").length;

      if (successes >= 3) {
        // Good won quests -> Assassin phase if Assassin exists
        const assassinExists = room.players.some((p) => p.role === "Assassin");
        if (assassinExists) {
          room.state = "ASSASSINATION";
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
      room.winner = "Evil"; // Assassin got Merlin!
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
    delete room.winner;
    delete room.assassinationTarget;
    delete room.assassinationSuggestions;

    this.clearVoteOutcomeTimer(roomId);

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
    // In Lobby, Assassination phase, and Game Over, all roles are public!
    if (room.state === "LOBBY" || room.state === "ASSASSINATION" || room.state === "GAME_OVER") return room;


    const clone = JSON.parse(JSON.stringify(room)) as AvalonRoom;
    const me = clone.players.find((p) => p.userId === userId);

    if (!me) return clone;

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
    clone.players.forEach((p) => {
      if (p.userId !== me.userId) {
        let seeAsSpecificEvil = false;
        let seeAsGenericEvil = false;
        let seeAsMerlinLike = false; // Seen by Percival

        // Evil sees other Evil (except Oberon)
        if (me.team === "Evil" && me.role !== "Oberon") {
          if (p.team === "Evil" && p.role !== "Oberon") {
            seeAsSpecificEvil = true;
          }
        }

        // Merlin sees Evil (except Mordred)
        if (me.role === "Merlin") {
          if (p.team === "Evil" && p.role !== "Mordred") {
            seeAsGenericEvil = true;
          }
        }

        // Percival sees Merlin and Morgana as targets
        if (me.role === "Percival") {
          if (p.role === "Merlin" || p.role === "Morgana") {
            seeAsMerlinLike = true;
          }
        }

        // Obfuscate quest votes until revealed? Not strictly needed for payload if we clear them,
        // but we shouldn't send individual questVotes.
        delete p.questVote;

        // Apply obfuscation
        if (!seeAsSpecificEvil && !seeAsGenericEvil && !seeAsMerlinLike) {
          delete p.role;
          delete p.team;
        } else if (seeAsSpecificEvil) {
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
