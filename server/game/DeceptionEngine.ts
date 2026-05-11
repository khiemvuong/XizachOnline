import { Server, Socket, Namespace } from "socket.io";
import type {
  DeceptionRoom,
  DeceptionPlayer,
  DeceptionRole,
  DeceptionTeam,
  DeceptionSettings,
  SolvingAttempt,
} from "./DeceptionTypes";
import {
  MEANS_CARDS,
  CLUE_CARDS,
  shuffle,
  generateSceneTiles,
} from "./DeceptionData";


export class DeceptionEngine {
  private rooms: Map<string, DeceptionRoom> = new Map();
  private io: Namespace;
  private chatRateLimits: Map<string, number[]> = new Map();
  private discussionTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private solvingNoticeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private emptyRoomCleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private voicePolicyNoticeCooldown: Map<string, number> = new Map();

  constructor(server: Server) {
    this.io = server.of("/deception");
    this.setupListeners();
  }

  // ─── Helpers ───

  private addSystemMessage(room: DeceptionRoom, text: string) {
    room.messages.push({
      senderId: "system",
      senderName: "Hệ thống",
      text,
      timestamp: Date.now(),
    });
    if (room.messages.length > 50) room.messages.shift();
  }

  private uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getActivePlayers(room: DeceptionRoom): DeceptionPlayer[] {
    return room.players.filter((p) => !p.isSpectator && p.status === "connected");
  }

  private findPlayer(room: DeceptionRoom, userId: string): DeceptionPlayer | undefined {
    return room.players.find((p) => p.userId === userId);
  }

  private findPlayerByRole(room: DeceptionRoom, role: DeceptionRole): DeceptionPlayer | undefined {
    return room.players.find((p) => p.role === role && !p.isSpectator);
  }

  private clearDiscussionTimer(roomId: string) {
    const timer = this.discussionTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.discussionTimers.delete(roomId);
    }
  }

  private clearSolvingNoticeTimer(roomId: string) {
    const timer = this.solvingNoticeTimers.get(roomId);
    if (!timer) return;
    clearTimeout(timer);
    this.solvingNoticeTimers.delete(roomId);
  }

  private clearEmptyRoomCleanup(roomId: string) {
    const timer = this.emptyRoomCleanupTimers.get(roomId);
    if (!timer) return;
    clearTimeout(timer);
    this.emptyRoomCleanupTimers.delete(roomId);
  }

  private scheduleEmptyRoomCleanup(roomId: string) {
    this.clearEmptyRoomCleanup(roomId);

    const timer = setTimeout(() => {
      const room = this.rooms.get(roomId);
      this.emptyRoomCleanupTimers.delete(roomId);
      if (!room) return;

      const hasConnectedPlayer = room.players.some((player) => player.status === "connected");
      if (hasConnectedPlayer) return;

      this.clearDiscussionTimer(roomId);
      this.clearSolvingNoticeTimer(roomId);
      this.rooms.delete(roomId);
    }, 15000);

    this.emptyRoomCleanupTimers.set(roomId, timer);
  }



  // ─── Role Assignment ───

  private getRoleCounts(numPlayers: number, settings: DeceptionSettings) {
    // FS:1 + Murderer:1 = always 2; rest are investigators
    // Accomplice & Witness added based on settings + player count
    const enableAccomplice = settings.enableAccomplice && numPlayers >= 6;
    const enableWitness = settings.enableWitness && numPlayers >= 6;

    // Advanced roles: Lover always at 7+, Phantom/Detective based on settings + count
    const enableLover = settings.enableLover && numPlayers >= 7;
    // At 7 players: only one of Phantom/Detective can be enabled
    // At 8+: both can be enabled
    let enablePhantom = settings.enablePhantom && numPlayers >= 7;
    let enableDetective = settings.enableDetective && numPlayers >= 7;
    if (numPlayers === 7 && enablePhantom && enableDetective) {
      // Force only one — prefer whichever was toggled; fallback: random
      if (Math.random() < 0.5) enableDetective = false;
      else enablePhantom = false;
    }

    const specialCount = 2
      + (enableAccomplice ? 1 : 0)
      + (enableWitness ? 1 : 0)
      + (enableLover ? 1 : 0)
      + (enablePhantom ? 1 : 0)
      + (enableDetective ? 1 : 0);
    const investigators = numPlayers - specialCount;

    return { enableAccomplice, enableWitness, enableLover, enablePhantom, enableDetective, investigators };
  }

  private assignRoles(room: DeceptionRoom) {
    const activePlayers = this.getActivePlayers(room);
    const numPlayers = activePlayers.length;
    const { enableAccomplice, enableWitness, enableLover, enablePhantom, enableDetective, investigators } =
      this.getRoleCounts(numPlayers, room.settings);

    // Reset all player roles
    activePlayers.forEach(p => p.role = undefined);

    const roleToTeam = (role: DeceptionRole): DeceptionTeam => {
      if (role === "Murderer" || role === "Accomplice" || role === "Lover") return "Murderer";
      if (role === "Phantom" || role === "Detective") return "Independent";
      return "Investigator";
    };

    // 1. Determine Forensic Scientist (Sequential)
    let forensicIndex = 0;
    if (!room.lastForensicScientistUserId) {
      const hostPlayer = activePlayers.findIndex(p => p.isHost);
      forensicIndex = hostPlayer !== -1 ? hostPlayer : 0;
    } else {
      const prevIndex = activePlayers.findIndex(p => p.userId === room.lastForensicScientistUserId);
      forensicIndex = (Math.max(0, prevIndex) + 1) % numPlayers;
    }
    const forensicPlayer = activePlayers[forensicIndex];
    room.lastForensicScientistUserId = forensicPlayer.userId;
    forensicPlayer.role = "ForensicScientist";

    // 2. Determine Murderer
    //
    // Rule A – permanent blacklist: "minhtu" can NEVER be Murderer / Accomplice.
    // Rule B – quota rule: anyone whose normalised name contains "thao" OR equals "chu"
    //          must be Murderer exactly once every 3 games (at least 1 and at most 1).
    //          The quota is tracked per-userId in room.murdererQuotaMap.
    //          A player is "due" when their murdererCount < ceil(gamesPlayed / 3).
    //          A player is "capped" when their murdererCount >= ceil(gamesPlayed / 3).

    /** Strip Vietnamese diacritics, spaces, and lowercase */
    const normalize = (s: string) =>
      s.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const BLACKLISTED = ["minhtu"];
    const isBlacklisted = (p: DeceptionPlayer) => BLACKLISTED.includes(normalize(p.name));
    const isThaoGroup   = (p: DeceptionPlayer) => {
      const n = normalize(p.name);
      return n.includes("thao") || n === "chu";
    };

    if (!room.murdererQuotaMap) room.murdererQuotaMap = {};

    // Candidates = everyone except FS
    const murdererCandidates = activePlayers.filter(p => p.role !== "ForensicScientist");

    // Update gamesPlayed for all thao-group candidates
    for (const p of murdererCandidates.filter(isThaoGroup)) {
      if (!room.murdererQuotaMap[p.userId]) {
        room.murdererQuotaMap[p.userId] = { gamesPlayed: 0, murdererCount: 0 };
      }
      room.murdererQuotaMap[p.userId].gamesPlayed++;
    }

    // Among thao-group: find those who are "due" (murdererCount < ceil(gamesPlayed/3))
    const thaoCandidates = murdererCandidates.filter(isThaoGroup);
    const dueThaoPlayers = thaoCandidates.filter(p => {
      const q = room.murdererQuotaMap![p.userId];
      return q && q.murdererCount < Math.ceil(q.gamesPlayed / 3);
    });

    let murdererPlayer: DeceptionPlayer;

    if (dueThaoPlayers.length > 0) {
      // Force-pick one of the due thao players at random
      murdererPlayer = dueThaoPlayers[Math.floor(Math.random() * dueThaoPlayers.length)];
    } else {
      // Normal random selection — excluding blacklisted players and capped quota players
      let allowedCandidates = murdererCandidates.filter(p => {
        if (isBlacklisted(p)) return false;
        if (isThaoGroup(p)) {
          const q = room.murdererQuotaMap![p.userId];
          // If they reached the quota (1 per 3 games), block them from being murderer by chance
          if (q && q.murdererCount >= Math.ceil(q.gamesPlayed / 3)) return false;
        }
        return true;
      });

      if (allowedCandidates.length === 0) allowedCandidates = murdererCandidates;
      murdererPlayer = allowedCandidates[Math.floor(Math.random() * allowedCandidates.length)];
    }

    murdererPlayer.role = "Murderer";

    // Record quota if this player is in the thao-group
    if (isThaoGroup(murdererPlayer) && room.murdererQuotaMap[murdererPlayer.userId]) {
      room.murdererQuotaMap[murdererPlayer.userId].murdererCount++;
    }

    // 3. Determine Witness (Randomized Turn-based)
    if (enableWitness) {
      const witnessCandidates = activePlayers.filter(
        (p) => p.role !== "ForensicScientist" && p.role !== "Murderer"
      );

      if (witnessCandidates.length > 0) {
        if (!room.witnessCycleUserIds) room.witnessCycleUserIds = [];

        // Filter candidates who haven't been Witness in the current cycle
        let availableInCycle = witnessCandidates.filter(
          (p) => !room.witnessCycleUserIds!.includes(p.userId)
        );

        // If cycle is complete or no available candidates in cycle, reset it
        if (availableInCycle.length === 0) {
          room.witnessCycleUserIds = [];
          availableInCycle = witnessCandidates;
        }

        // To break the "Witness this round -> Forensic next round" pattern,
        // we try to avoid picking the person who is most likely to be Forensic next.
        // The next forensic index is (forensicIndex + 1) % numPlayers.
        const nextForensicIndex = (forensicIndex + 1) % numPlayers;
        const nextForensicPlayer = activePlayers[nextForensicIndex];
        
        let finalSelectionPool = availableInCycle;
        if (availableInCycle.length > 1) {
          // Avoid the next Forensic Scientist if we have other choices
          finalSelectionPool = availableInCycle.filter(p => p.userId !== nextForensicPlayer.userId);
          // If filtering everyone out (e.g. only 1 person left in cycle and they are next FS), 
          // then just use the original pool.
          if (finalSelectionPool.length === 0) finalSelectionPool = availableInCycle;
        }

        // Pick a random player from the filtered pool
        const witnessPlayer = finalSelectionPool[Math.floor(Math.random() * finalSelectionPool.length)];
        
        witnessPlayer.role = "Witness";
        room.witnessCycleUserIds.push(witnessPlayer.userId);
      }
    }

    // 4. Assign remaining roles (Accomplice, Lover, Phantom, Detective, and Investigators)
    // Blacklisted players (khim/minhtu) must not receive Accomplice or Lover.
    const unassigned = activePlayers.filter((p) => p.role === undefined);
    const allowedUnassigned = unassigned.filter((p) => !isBlacklisted(p));
    const blacklistedUnassigned = unassigned.filter((p) => isBlacklisted(p));

    const restrictedRoles: DeceptionRole[] = [];
    if (enableAccomplice) restrictedRoles.push("Accomplice");
    if (enableLover) restrictedRoles.push("Lover");

    const safeRoles: DeceptionRole[] = [];
    if (enablePhantom) safeRoles.push("Phantom");
    if (enableDetective) safeRoles.push("Detective");
    for (let i = 0; i < investigators; i++) safeRoles.push("Investigator");

    shuffle(restrictedRoles);
    shuffle(safeRoles);
    shuffle(allowedUnassigned);
    shuffle(blacklistedUnassigned);

    // Assign restricted roles to allowed players first
    for (const p of allowedUnassigned) {
      if (restrictedRoles.length > 0) {
        p.role = restrictedRoles.pop()!;
      } else {
        p.role = safeRoles.pop()!;
      }
    }

    // Assign safe roles to blacklisted players
    for (const p of blacklistedUnassigned) {
      if (safeRoles.length > 0) {
        p.role = safeRoles.pop()!;
      } else {
        // Fallback only if there are absolutely no safe roles left (mathematically unlikely)
        p.role = restrictedRoles.pop() ?? "Investigator";
      }
    }

    activePlayers.forEach((p) => {
      p.team = roleToTeam(p.role!);
      p.isReady = false;
      p.hasBadge = p.role !== "ForensicScientist";
    });
  }

  private getFairCards<T extends { group?: string }>(
    allCards: T[],
    numReceivers: number,
    cardsPerPlayer: number
  ): T[][] {
    const totalNeeded = numReceivers * cardsPerPlayer;
    const shuffled = shuffle([...allCards]);
    
    // 1. Build a globally balanced pool
    const uniqueGroups = new Set(shuffled.map(c => c.group || "unknown")).size;
    // Tương đối: Giới hạn tối đa số lượng thẻ của 1 nhóm xuất hiện trong ván
    const globalLimit = Math.ceil(totalNeeded / Math.max(1, uniqueGroups)) + 1;

    const globalPool: T[] = [];
    const globalCounts: Record<string, number> = {};
    const rejects: T[] = [];

    for (const card of shuffled) {
      if (globalPool.length >= totalNeeded) break;
      const g = card.group || "unknown";
      if ((globalCounts[g] || 0) < globalLimit) {
        globalPool.push(card);
        globalCounts[g] = (globalCounts[g] || 0) + 1;
      } else {
        rejects.push(card);
      }
    }
    
    // Nếu thiếu bài (rất hiếm), bổ sung từ rejects
    while (globalPool.length < totalNeeded && rejects.length > 0) {
      globalPool.push(rejects.shift()!);
    }

    const finalPool = shuffle(globalPool);

    // 2. Chia bài cho người chơi (giới hạn cục bộ để 1 người không ôm hết 1 nhóm)
    const playerHands: T[][] = Array.from({ length: numReceivers }, () => []);
    const localLimit = Math.ceil(cardsPerPlayer / 2); // vd: 4 lá -> max 2 lá cùng nhóm

    for (let round = 0; round < cardsPerPlayer; round++) {
      for (let p = 0; p < numReceivers; p++) {
        const hand = playerHands[p];
        const localCounts: Record<string, number> = {};
        hand.forEach(c => {
          const g = c.group || "unknown";
          localCounts[g] = (localCounts[g] || 0) + 1;
        });

        // Tìm lá bài không vi phạm localLimit
        let foundIndex = finalPool.findIndex(c => (localCounts[c.group || "unknown"] || 0) < localLimit);
        if (foundIndex === -1) {
          foundIndex = 0; // Fallback
        }

        hand.push(finalPool.splice(foundIndex, 1)[0]);
      }
    }

    return playerHands;
  }

  // ─── Card Dealing ───

  private dealCards(room: DeceptionRoom) {
    const cardsPerPlayer = room.settings.meansCardsPerPlayer;
    const cluesPerPlayer = room.settings.clueCardsPerPlayer;

    // Only non-FS active players receive cards
    const receivers = room.players.filter(
      (p) => !p.isSpectator && p.role !== "ForensicScientist",
    );

    const meansHands = this.getFairCards(MEANS_CARDS, receivers.length, cardsPerPlayer);
    const clueHands = this.getFairCards(CLUE_CARDS, receivers.length, cluesPerPlayer);

    receivers.forEach((p, i) => {
      p.meansCards = meansHands[i];
      p.clueCards = clueHands[i];
    });

    // FS gets no cards
    const fs = this.findPlayerByRole(room, "ForensicScientist");
    if (fs) {
      fs.meansCards = [];
      fs.clueCards = [];
    }
  }

  // ─── Socket Listeners ───

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Deception client connected:", socket.id);

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
        console.log("Deception client disconnected:", socket.id);
        if (socket.data.roomId) {
          this.leaveRoom(socket.data.roomId, socket.id);
        }
      });

      socket.on("chatMessage", (text: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.chatMessage(socket.data.roomId, socket.data.userId, text);
        }
      });

      socket.on("updateSettings", (settings: Partial<DeceptionSettings>) => {
        if (socket.data.roomId && socket.data.userId) {
          this.updateSettings(socket.data.roomId, socket.data.userId, settings);
        }
      });

      socket.on("startGame", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.startGame(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("playerReady", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.playerReady(socket.data.roomId, socket.data.userId);
        }
      });

      // Night phase: Murderer selects means + clue
      socket.on("murdererSelect", (selection: { meansId: number; clueId: number }) => {
        if (socket.data.roomId && socket.data.userId) {
          this.murdererSelect(socket.data.roomId, socket.data.userId, selection);
        }
      });

      // Scene setup: Forensic places markers
      socket.on("placeMarker", (payload: { tileId: string; optionIndex: number }) => {
        if (socket.data.roomId && socket.data.userId) {
          this.placeMarker(socket.data.roomId, socket.data.userId, payload);
        }
      });

      socket.on("chooseReplacementTile", (tileId: string) => {
        if (socket.data.roomId && socket.data.userId && typeof tileId === "string") {
          this.chooseReplacementTile(socket.data.roomId, socket.data.userId, tileId);
        }
      });

      socket.on("confirmSceneSetup", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.confirmSceneSetup(socket.data.roomId, socket.data.userId);
        }
      });

      // Forensic starts/resumes discussion timer
      socket.on("startDiscussion", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.startDiscussion(socket.data.roomId, socket.data.userId);
        }
      });

      // Forensic pauses discussion timer
      socket.on("pauseDiscussion", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.pauseDiscussion(socket.data.roomId, socket.data.userId);
        }
      });

      // Investigator initiates solving
      socket.on(
        "submitSolving",
        (payload: { accusedUserId: string; meansId: number; clueId: number }) => {
          if (socket.data.roomId && socket.data.userId) {
            this.submitSolving(socket.data.roomId, socket.data.userId, payload);
          }
        },
      );

      // Forensic confirms solving result (server computes correct/incorrect)
      socket.on("resolveSolving", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.resolveSolving(socket.data.roomId, socket.data.userId);
        }
      });

      // Murderer selects witness hunt target
      socket.on("witnessHuntSelect", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.witnessHuntSelect(socket.data.roomId, socket.data.userId, targetUserId);
        }
      });

      // Broadcast "shame" popup to all players during ROLE_REVEAL
      socket.on("slackerAlert", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const room = this.rooms.get(roomId);
        if (!room || room.state !== "ROLE_REVEAL") return;

        const notReadyNames = room.players
          .filter(p => !p.isSpectator && p.status === "connected" && !p.isReady)
          .map(p => p.name);

        this.io.to(roomId).emit("slackerAlert", notReadyNames);
      });

      // Return to lobby / restart
      socket.on("returnToLobby", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.returnToLobby(socket.data.roomId, socket.data.userId);
        }
      });

      socket.on("changeName", (newName: string) => {
        if (socket.data.roomId && socket.data.userId && typeof newName === "string") {
          this.changeName(socket.data.roomId, socket.data.userId, newName.trim().slice(0, 12));
        }
      });

      socket.on("updateAvatar", (avatarUrl: string | null) => {
        if (socket.data.roomId && socket.data.userId) {
          this.updateAvatar(socket.data.roomId, socket.data.userId, avatarUrl);
        }
      });

      socket.on("transferHost", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.transferHost(socket.data.roomId, socket.data.userId, targetUserId);
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
          if (typeof callback === "function") callback(timestamp);
        },
      );

      socket.on("updatePing", (userId: string, ping: number) => {
        if (socket.data.roomId && userId) {
          socket.to(socket.data.roomId).emit("playerPing", userId, ping);
        }
      });
    });
  }

  // ─── Room Management ───

  private createRoom(roomId: string) {
    if (this.rooms.has(roomId)) return;

    this.rooms.set(roomId, {
      id: roomId,
      players: [],
      state: "LOBBY",
      settings: {
        enableAccomplice: true,
        enableWitness: true,
        discussionTimeSeconds: 180,
        meansCardsPerPlayer: 4,
        clueCardsPerPlayer: 4,
        sceneDifficulty: "hard",
        enableLover: false,
        enablePhantom: false,
        enableDetective: false,
        enableDepersonalization: false,
      },
      messages: [],
      murderSelection: null,
      activeSceneTiles: [],
      scenePool: [],
      replacedTileIndex: null,
      awaitingReplacementChoice: false,
      forensicMarkerAdjustmentUsedThisRound: false,
      currentRound: 1,
      timerEndAt: null,
      timerPausedRemaining: null,
      solvingAttempts: [],
      activeSolvingAttempt: null,
      solvingResolutionNotice: null,
      lastForensicScientistUserId: null,
      witnessCycleUserIds: [],
      murdererQuotaMap: {},
      isDepersonalizationActive: false,
    });


  }

  public joinRoom(
    roomId: string,
    pData: { id: string; userId: string; name: string; avatarUrl?: string },
    socket: Socket,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit("deceptionError", "Phòng không tồn tại hoặc đã bị giải tán!");
      return;
    }

    const room = this.rooms.get(roomId)!;
  this.clearEmptyRoomCleanup(roomId);
    const existing = room.players.find((p) => p.userId === pData.userId);

    if (existing) {
      existing.id = pData.id;
      existing.name = pData.name;
      if (pData.avatarUrl !== undefined) existing.avatarUrl = pData.avatarUrl;
      existing.status = "connected";

      if (room.state === "LOBBY" && !existing.isHost) {
        const idx = room.players.indexOf(existing);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          room.players.push(existing);
        }
      }
    } else {
      const isHost = room.players.length === 0;
      const isMidGame = room.state !== "LOBBY";
      room.players.push({
        id: pData.id,
        userId: pData.userId,
        name: pData.name,
        avatarUrl: pData.avatarUrl,
        isHost: isHost && !isMidGame,
        status: "connected",
        meansCards: [],
        clueCards: [],
        hasBadge: false,
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
    if (pIndex === -1) return;

    const player = room.players[pIndex];
    player.status = "disconnected";

    const canRemove = room.state === "LOBBY" || player.isSpectator;
    if (canRemove) {
      room.players.splice(pIndex, 1);
      if (room.players.length === 0) {
        this.scheduleEmptyRoomCleanup(roomId);
        return;
      }
      if (player.isHost) {
        const newHost =
          room.players.find((p) => p.status === "connected" && !p.isSpectator) ??
          room.players[0];
        newHost.isHost = true;
      }
    }

    this.broadcastState(roomId);
  }

  // ─── Chat ───

  public chatMessage(roomId: string, userId: string, text: string) {
    if (!text || text.length > 500) return;

    const now = Date.now();
    let userStamps = this.chatRateLimits.get(userId) || [];
    userStamps = userStamps.filter((time) => now - time < 10000);
    if (userStamps.length >= 10) return;
    userStamps.push(now);
    this.chatRateLimits.set(userId, userStamps);

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = this.findPlayer(room, userId);
    if (!player) return;

    // Forensic Scientist cannot chat during active game
    if (player.role === "ForensicScientist" && room.state !== "LOBBY" && room.state !== "GAME_OVER") {
      return;
    }

    room.messages.push({
      senderId: player.userId,
      senderName: player.name,
      text,
      timestamp: Date.now(),
    });
    if (room.messages.length > 50) room.messages.shift();
    this.broadcastState(roomId);
  }

  // ─── Settings ───

  public updateSettings(roomId: string, userId: string, settings: Partial<DeceptionSettings>) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    // Clamp discussion time
    if (settings.discussionTimeSeconds !== undefined) {
      settings.discussionTimeSeconds = Math.max(60, Math.min(600, settings.discussionTimeSeconds));
    }

    // Validate sceneDifficulty
    if (settings.sceneDifficulty !== undefined && settings.sceneDifficulty !== "easy" && settings.sceneDifficulty !== "hard") {
      delete settings.sceneDifficulty;
    }

    room.settings = { ...room.settings, ...settings };
    this.broadcastState(roomId);
  }

  // ─── Game Flow ───

  public startGame(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    const activePlayers = this.getActivePlayers(room);
    if (activePlayers.length < 4) return;

    // Reset game state
    room.murderSelection = null;
    room.activeSceneTiles = [];
    room.scenePool = [];
    room.replacedTileIndex = null;
    room.awaitingReplacementChoice = false;
    room.forensicMarkerAdjustmentUsedThisRound = false;
    room.currentRound = 1;
    room.timerEndAt = null;
    room.timerPausedRemaining = null;
    room.solvingAttempts = [];
    room.activeSolvingAttempt = null;
    room.solvingResolutionNotice = null;
    room.winner = undefined;
    room.witnessHuntTarget = undefined;
    room.witnessHuntResult = undefined;
    room.messages = [];
    room.isDepersonalizationActive = room.settings.enableDepersonalization && Math.random() < 0.5;

    this.assignRoles(room);
    this.dealCards(room);

    room.state = "ROLE_REVEAL";
    this.addSystemMessage(room, "Trò chơi bắt đầu! Hãy xem vai trò của bạn.");
    this.broadcastState(roomId);
  }

  public playerReady(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "ROLE_REVEAL") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.isSpectator) return;

    player.isReady = true;

    const allReady = room.players
      .filter((p) => p.status === "connected" && !p.isSpectator)
      .every((p) => p.isReady);

    if (allReady) {
      if (room.isDepersonalizationActive) {
        const murderer = room.players.find(p => p.role === "Murderer" && !p.isSpectator);
        if (murderer && murderer.meansCards.length > 0 && murderer.clueCards.length > 0) {
          const randomMeans = murderer.meansCards[Math.floor(Math.random() * murderer.meansCards.length)];
          const randomClue = murderer.clueCards[Math.floor(Math.random() * murderer.clueCards.length)];
          room.murderSelection = {
            meansId: randomMeans.id,
            clueId: randomClue.id,
          };
        }

        room.state = "NIGHT_PHASE";
        this.addSystemMessage(room, "Đêm xuống... Kẻ sát nhân hãy chọn hung khí và manh mối.");

        // Random wait between 8s and 15s
        const waitTime = Math.floor(Math.random() * 7000) + 8000;
        setTimeout(() => {
          const activeRoom = this.rooms.get(roomId);
          if (!activeRoom || activeRoom.state !== "NIGHT_PHASE") return;

          // Generate scene tiles using the selected difficulty
          const { active, pool } = generateSceneTiles(activeRoom.settings.sceneDifficulty);
          activeRoom.activeSceneTiles = active;
          activeRoom.scenePool = pool;

          activeRoom.state = "SCENE_SETUP";
          this.addSystemMessage(activeRoom, "Pháp y đang thiết lập hiện trường...");
          this.broadcastState(roomId);
        }, waitTime);
      } else {
        room.state = "NIGHT_PHASE";
        this.addSystemMessage(room, "Đêm xuống... Kẻ sát nhân hãy chọn hung khí và manh mối.");
      }
    }

    this.broadcastState(roomId);
  }

  // ─── Night Phase ───

  public murdererSelect(
    roomId: string,
    userId: string,
    selection: { meansId: number; clueId: number },
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_PHASE") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Murderer") return;
    if (room.isDepersonalizationActive) return;

    // Validate that means & clue belong to the murderer's cards
    const hasMeans = player.meansCards.some((c) => c.id === selection.meansId);
    const hasClue = player.clueCards.some((c) => c.id === selection.clueId);
    if (!hasMeans || !hasClue) return;

    room.murderSelection = {
      meansId: selection.meansId,
      clueId: selection.clueId,
    };

    // Generate scene tiles using the selected difficulty
    const { active, pool } = generateSceneTiles(room.settings.sceneDifficulty);
    room.activeSceneTiles = active;
    room.scenePool = pool;

    room.state = "SCENE_SETUP";
    this.addSystemMessage(room, "Pháp y đang thiết lập hiện trường...");
    this.broadcastState(roomId);
  }

  // ─── Scene Setup (Forensic Scientist) ───

  public placeMarker(
    roomId: string,
    userId: string,
    payload: { tileId: string; optionIndex: number },
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "SCENE_SETUP") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;
    if (room.awaitingReplacementChoice) return;

    const tile = room.activeSceneTiles.find((t) => t.id === payload.tileId);
    if (!tile) return;
    if (payload.optionIndex < 0 || payload.optionIndex >= tile.options.length) return;
    if (tile.markerIndex === payload.optionIndex) return;

    const isInitialSetup = room.currentRound === 1 && room.replacedTileIndex === null;
    const isPostReplacementAdjustment = room.currentRound > 1 && room.replacedTileIndex !== null;

    if (!isInitialSetup) {
      if (!isPostReplacementAdjustment) return;
      const isChangingExistingMarker = tile.markerIndex !== null;
      if (isChangingExistingMarker && room.forensicMarkerAdjustmentUsedThisRound) return;
      if (isChangingExistingMarker) {
        room.forensicMarkerAdjustmentUsedThisRound = true;
      }
    }

    tile.markerIndex = payload.optionIndex;
    this.broadcastState(roomId);
  }

  public chooseReplacementTile(roomId: string, userId: string, tileId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "SCENE_SETUP") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;
    if (!room.awaitingReplacementChoice) return;
    if (room.scenePool.length === 0) return;

    const replaceTarget = room.activeSceneTiles
      .map((tile, index) => ({ tile, index }))
      .find((entry) => entry.tile.id === tileId && entry.tile.type === "evidence_brown");

    if (!replaceTarget) return;

    const newTile = room.scenePool.shift()!;
    newTile.markerIndex = null;
    room.activeSceneTiles[replaceTarget.index] = newTile;
    room.replacedTileIndex = replaceTarget.index;
    room.awaitingReplacementChoice = false;

    this.addSystemMessage(room, `Pháp y đã thay gợi ý: ${replaceTarget.tile.nameVi}. Hãy đặt dấu cho ô mới.`);
    this.broadcastState(roomId);
  }

  public confirmSceneSetup(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "SCENE_SETUP") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;
    if (room.awaitingReplacementChoice) return;

    // Verify all tiles have markers
    const allMarked = room.activeSceneTiles.every((t) => t.markerIndex !== null);
    if (!allMarked) return;

    room.state = "DISCUSSION";
    
    // Auto-start timer
    const durationMs = room.settings.discussionTimeSeconds * 1000;
    room.timerEndAt = Date.now() + durationMs;
    this.clearDiscussionTimer(roomId);
    this.clearSolvingNoticeTimer(roomId);
    this.discussionTimers.set(
      roomId,
      setTimeout(() => this.onDiscussionTimeout(roomId), durationMs),
    );

    this.addSystemMessage(
      room,
      `Hiện trường đã được niêm phong. Round ${room.currentRound} bắt đầu! Thời gian: ${room.settings.discussionTimeSeconds}s`,
    );
    this.broadcastState(roomId);
  }

  // ─── Discussion + Timer ───

  public startDiscussion(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DISCUSSION") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;

    if (room.timerEndAt) return; // Already running

    let durationMs: number;
    if (room.timerPausedRemaining != null) {
      durationMs = room.timerPausedRemaining;
      room.timerPausedRemaining = null;
      this.addSystemMessage(room, `Thời gian thảo luận được tiếp tục.`);
    } else {
      durationMs = room.settings.discussionTimeSeconds * 1000;
      this.addSystemMessage(
        room,
        `Round ${room.currentRound} bắt đầu! Thời gian: ${room.settings.discussionTimeSeconds}s`,
      );
    }
    
    room.timerEndAt = Date.now() + durationMs;

    this.clearDiscussionTimer(roomId);
    this.clearSolvingNoticeTimer(roomId);
    this.discussionTimers.set(
      roomId,
      setTimeout(() => this.onDiscussionTimeout(roomId), durationMs),
    );

    this.broadcastState(roomId);
  }

  public pauseDiscussion(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DISCUSSION") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;

    if (!room.timerEndAt) return; // Not running

    room.timerPausedRemaining = Math.max(0, room.timerEndAt - Date.now());
    room.timerEndAt = null;
    this.clearDiscussionTimer(roomId);
    this.addSystemMessage(room, `Pháp y đã tạm dừng thời gian thảo luận.`);
    this.broadcastState(roomId);
  }

  private onDiscussionTimeout(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DISCUSSION") return;

    this.clearDiscussionTimer(roomId);

    if (room.currentRound >= 3) {
      // All 3 rounds exhausted
      this.endGameByTimeout(roomId, room);
    } else {
      // Advance to next round — replace a tile
      this.advanceRound(roomId, room);
    }
  }

  private advanceRound(roomId: string, room: DeceptionRoom) {
    room.currentRound++;
    room.timerEndAt = null;
    room.replacedTileIndex = null;
    room.forensicMarkerAdjustmentUsedThisRound = false;

    // For rounds 2+ the forensic must choose which yellow clue to replace.
    const replaceableIndices = room.activeSceneTiles
      .map((t, i) => ({ tile: t, index: i }))
      .filter((x) => x.tile.type === "evidence_brown");

    room.awaitingReplacementChoice = replaceableIndices.length > 0 && room.scenePool.length > 0;

    room.state = "SCENE_SETUP";
    if (room.awaitingReplacementChoice) {
      this.addSystemMessage(
        room,
        `Round ${room.currentRound} — Pháp y, hãy chọn 1 gợi ý vàng để bỏ rồi thay ô mới.`,
      );
    } else {
      this.addSystemMessage(room, `Round ${room.currentRound} — Pháp y, hãy đặt dấu trên hiện trường.`);
    }
    this.broadcastState(roomId);
  }

  private endGameByTimeout(roomId: string, room: DeceptionRoom) {
    this.clearSolvingNoticeTimer(roomId);
    room.state = "GAME_OVER";
    room.winner = "Murderer";
    room.timerEndAt = null;
    room.timerPausedRemaining = null;
    room.solvingResolutionNotice = null;
    room.witnessHuntTarget = undefined;
    room.witnessHuntResult = undefined;
    this.addSystemMessage(room, "Hết giờ! Phe sát nhân thắng — không ai phá được án.");
    this.broadcastState(roomId);
  }

  // ─── Solving ───

  public submitSolving(
    roomId: string,
    userId: string,
    payload: { accusedUserId: string; meansId: number; clueId: number },
  ) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DISCUSSION") return;
    if (room.activeSolvingAttempt) return; // Already a pending attempt

    const player = this.findPlayer(room, userId);
    if (!player || player.isSpectator) return;
    if (!player.hasBadge) return; // Already used badge
    if (player.role === "ForensicScientist") return; // FS can't solve

    const accused = this.findPlayer(room, payload.accusedUserId);
    if (!accused || accused.role === "ForensicScientist") return;

    // Validate means and clue belong to accused
    const hasAccusedMeans = accused.meansCards.some((c) => c.id === payload.meansId);
    const hasAccusedClue = accused.clueCards.some((c) => c.id === payload.clueId);
    if (!hasAccusedMeans || !hasAccusedClue) return;

    const expectedResult: "correct" | "incorrect" =
      Boolean(room.murderSelection) &&
      accused.role === "Murderer" &&
      payload.meansId === room.murderSelection!.meansId &&
      payload.clueId === room.murderSelection!.clueId
        ? "correct"
        : "incorrect";

    const attempt: SolvingAttempt = {
      id: this.uid(),
      investigatorUserId: userId,
      investigatorName: player.name,
      accusedUserId: payload.accusedUserId,
      accusedName: accused.name,
      selectedMeansId: payload.meansId,
      selectedClueId: payload.clueId,
      result: expectedResult,
      timestamp: Date.now(),
    };

    room.activeSolvingAttempt = attempt;
    room.state = "SOLVING_ATTEMPT";
    room.solvingResolutionNotice = null;
    this.clearSolvingNoticeTimer(roomId);

    // Pause timer
    if (room.timerEndAt) {
      room.timerPausedRemaining = Math.max(0, room.timerEndAt - Date.now());
      room.timerEndAt = null;
      this.clearDiscussionTimer(roomId);
    }

    this.addSystemMessage(
      room,
      `${player.name} đang phá án! Tố cáo ${accused.name}.`,
    );
    this.broadcastState(roomId);
  }

  public resolveSolving(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "SOLVING_ATTEMPT" || !room.activeSolvingAttempt) return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;

    const attempt = room.activeSolvingAttempt;
    const accused = this.findPlayer(room, attempt.accusedUserId);
    const result: "correct" | "incorrect" =
      attempt.result === "correct" || attempt.result === "incorrect"
        ? attempt.result
        : Boolean(room.murderSelection) &&
            accused?.role === "Murderer" &&
            attempt.selectedMeansId === room.murderSelection!.meansId &&
            attempt.selectedClueId === room.murderSelection!.clueId
          ? "correct"
          : "incorrect";

    attempt.result = result;
    room.solvingAttempts.push(attempt);
    room.activeSolvingAttempt = null;

    // Revoke badge from the player who attempted
    const solver = this.findPlayer(room, attempt.investigatorUserId);
    if (solver) solver.hasBadge = false;

    if (result === "correct") {
      const witness = this.findPlayerByRole(room, "Witness");
      const phantom = this.findPlayerByRole(room, "Phantom");
      room.timerEndAt = null;
      room.timerPausedRemaining = null;
      room.solvingResolutionNotice = null;
      this.clearSolvingNoticeTimer(roomId);

      // Detective win check: if the solver IS the Detective, Detective wins independently
      const solverPlayer = this.findPlayer(room, attempt.investigatorUserId);
      const isDetectiveWin = solverPlayer?.role === "Detective";

      if (witness || phantom) {
        // Witness hunt phase — Murderer must find Witness (Phantom wants to be found instead)
        room.state = "WITNESS_HUNT";
        room.winner = isDetectiveWin ? "Detective" : undefined;
        room.witnessHuntTarget = undefined;
        room.witnessHuntResult = undefined;
        this.addSystemMessage(
          room,
          `${attempt.investigatorName} đã phá án đúng! Kẻ sát nhân có cơ hội cuối cùng: săn nhân chứng.`,
        );
      } else {
        room.state = "GAME_OVER";
        room.winner = isDetectiveWin ? "Detective" : "Investigator";
        room.witnessHuntTarget = undefined;
        room.witnessHuntResult = undefined;
        this.addSystemMessage(room, isDetectiveWin
          ? `${attempt.investigatorName} (Thám Tử) đã tự mình phá án! Thám Tử chiến thắng độc lập!`
          : `${attempt.investigatorName} đã phá án thành công! Phe Điều tra thắng!`);
      }
    } else {
      this.addSystemMessage(room, `${attempt.investigatorName} phá án SAI. Huy hiệu bị thu hồi.`);

      room.solvingResolutionNotice = {
        result: "incorrect",
        investigatorName: attempt.investigatorName,
        accusedName: attempt.accusedName,
        timestamp: Date.now(),
      };
      this.clearSolvingNoticeTimer(roomId);

      // Check if any non-forensic player still has a badge
      const anyBadgeLeft = room.players.some(
        (p) => p.hasBadge && p.role !== "ForensicScientist" && !p.isSpectator,
      );

      if (!anyBadgeLeft) {
        // No badges left → same as timeout
        this.endGameByTimeout(roomId, room);
        return;
      } else {
        // Resume discussion after showing incorrect-result popup to everyone.
        room.state = "DISCUSSION";
        this.solvingNoticeTimers.set(
          roomId,
          setTimeout(() => {
            this.solvingNoticeTimers.delete(roomId);

            const latestRoom = this.rooms.get(roomId);
            if (!latestRoom) return;
            if (latestRoom.state !== "DISCUSSION" || latestRoom.activeSolvingAttempt) return;

            latestRoom.solvingResolutionNotice = null;

            if (latestRoom.timerPausedRemaining && latestRoom.timerPausedRemaining > 0) {
              latestRoom.timerEndAt = Date.now() + latestRoom.timerPausedRemaining;
              latestRoom.timerPausedRemaining = null;
              this.clearDiscussionTimer(roomId);
              this.discussionTimers.set(
                roomId,
                setTimeout(
                  () => this.onDiscussionTimeout(roomId),
                  Math.max(0, latestRoom.timerEndAt - Date.now()),
                ),
              );
            }

            this.broadcastState(roomId);
          }, 2200),
        );
      }
    }

    this.broadcastState(roomId);
  }

  // ─── Witness Hunt ───

  public witnessHuntSelect(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "WITNESS_HUNT") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Murderer") return;

    const target = this.findPlayer(room, targetUserId);
    if (!target || target.isSpectator) return;

    room.witnessHuntTarget = targetUserId;
    room.state = "GAME_OVER";
    room.solvingResolutionNotice = null;
    this.clearSolvingNoticeTimer(roomId);

    if (target.role === "Phantom") {
      // Phantom wins independently when hunted!
      room.witnessHuntResult = "phantom";
      // If Detective already won from solving, Detective still keeps win
      // but Phantom also gets recognized. Use Phantom as winner.
      room.winner = "Phantom";
      this.addSystemMessage(room, `Kẻ sát nhân đã chọn ${target.name} — nhưng đó là Bóng Ma! Bóng Ma chiến thắng!`);
    } else if (target.role === "Witness") {
      room.witnessHuntResult = "correct";
      room.winner = "Murderer";
      this.addSystemMessage(room, `Kẻ sát nhân đã tìm ra nhân chứng ${target.name}! Evil hoàn thắng!`);
    } else {
      room.witnessHuntResult = "incorrect";
      // If Detective already won, keep Detective win; otherwise Investigator win
      if (room.winner !== "Detective") {
        room.winner = "Investigator";
      }
      this.addSystemMessage(room, `Kẻ sát nhân chọn sai! ${target.name} không phải nhân chứng. Phe Điều tra giữ được chiến thắng!`);
    }

    this.broadcastState(roomId);
  }

  // ─── Utility Actions ───

  public changeName(roomId: string, userId: string, newName: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    if (!newName) return;

    const player = this.findPlayer(room, userId);
    if (player) {
      player.name = newName;
      this.broadcastState(roomId);
    }
  }

  public updateAvatar(roomId: string, userId: string, avatarUrl: string | null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = this.findPlayer(room, userId);
    if (player) {
      player.avatarUrl = avatarUrl ?? undefined;
      this.broadcastState(roomId);
    }
  }

  public transferHost(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    const target = this.findPlayer(room, targetUserId);
    if (!target || target.isSpectator) return;

    player.isHost = false;
    target.isHost = true;
    this.broadcastState(roomId);
  }

  public toggleSpectatorLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;

    const player = this.findPlayer(room, userId);
    if (!player) return;

    if (player.isHost) return; // Host can't be spectator

    player.isSpectator = !player.isSpectator;
    this.broadcastState(roomId);
  }

  public returnToLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    this.clearDiscussionTimer(roomId);

    room.state = "LOBBY";
    room.murderSelection = null;
    room.activeSceneTiles = [];
    room.scenePool = [];
    room.replacedTileIndex = null;
    room.awaitingReplacementChoice = false;
    room.forensicMarkerAdjustmentUsedThisRound = false;
    room.currentRound = 1;
    room.timerEndAt = null;
    room.timerPausedRemaining = null;
    room.solvingAttempts = [];
    room.activeSolvingAttempt = null;
    room.solvingResolutionNotice = null;
    room.winner = undefined;
    room.witnessHuntTarget = undefined;
    room.witnessHuntResult = undefined;
    room.isDepersonalizationActive = false;

    // Remove disconnected, clear roles
    room.players = room.players.filter((p) => p.status === "connected");
    room.players.forEach((p) => {
      delete p.role;
      delete p.team;
      p.isReady = false;
      p.isSpectator = false;
      p.meansCards = [];
      p.clueCards = [];
      p.hasBadge = false;
    });

    this.addSystemMessage(room, "Trở về phòng chờ.");
    this.broadcastState(roomId);
  }



  // ─── Broadcast (role-based information hiding) ───

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }



    const sockets = this.io.in(roomId);

    sockets.fetchSockets().then((socketList) => {
      for (const s of socketList) {
        const userId = s.data.userId as string | undefined;
        const me = userId ? room.players.find((p) => p.userId === userId) : undefined;
        const view = this.buildPlayerView(room, me);
        s.emit("stateUpdate", view);
      }
    });
  }

  private buildPlayerView(
    room: DeceptionRoom,
    me: DeceptionPlayer | undefined,
  ): Partial<DeceptionRoom> {
    const clone: DeceptionRoom = JSON.parse(JSON.stringify(room));
    delete clone.isDepersonalizationActive;

    const isGameActive =
      room.state !== "LOBBY" &&
      room.state !== "GAME_OVER";

    const isGameOver = room.state === "GAME_OVER";

    // ─── Game Over: reveal everything ───
    if (isGameOver) {
      return clone;
    }

    const normalizedMyName = me?.name
      ? me.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase()
      : "";
    const isKhim = normalizedMyName.includes("khim");

    // ─── Hide murder selection from most players ───
    if (clone.murderSelection) {
      let myRole = me?.role;
      if (room.isDepersonalizationActive && myRole === "Murderer" && room.state !== "WITNESS_HUNT") {
        myRole = "Investigator";
      }
      
      const canSeeSolution =
        myRole === "ForensicScientist" ||
        myRole === "Accomplice" ||
        myRole === "Murderer" ||
        myRole === "Lover" ||
        isKhim;

      if (!canSeeSolution) {
        clone.murderSelection = null;
      }
    }

    // ─── Hide scene pool (remaining tiles) from all ───
    clone.scenePool = [];

    // ─── During NIGHT_PHASE, only Witness/Accomplice see extra info ───
    // This is handled by role obfuscation below

    // ─── Obfuscate player roles ───
    if (isGameActive) {
      clone.players.forEach((p) => {
        // Set murderer hint (Only visible to 'khim')
        if (p.role === "Murderer" && isKhim) {
          p.isMurdererHint = true;
        }

        // Self-obfuscation: If I am the Murderer and Depersonalization is ON, I see myself as Investigator
        if (me && p.userId === me.userId) {
          if (room.isDepersonalizationActive && p.role === "Murderer" && room.state !== "WITNESS_HUNT") {
            p.role = "Investigator";
            p.team = "Investigator";
          }
          return;
        }

        if (!me || p.userId !== me.userId) {
          let myRole = me?.role;
          if (room.isDepersonalizationActive && myRole === "Murderer" && room.state !== "WITNESS_HUNT") {
            myRole = "Investigator";
          }

          // Everyone can see who is ForensicScientist (public role)
          if (p.role === "ForensicScientist") return;

          // ── Forensic sees ALL special roles ──
          if (
            myRole === "ForensicScientist" &&
            (p.role === "Murderer" || p.role === "Accomplice" || p.role === "Witness" ||
             p.role === "Lover" || p.role === "Phantom" || p.role === "Detective")
          ) {
            return;
          }

          // ── Witness sees Murderer + Accomplice ──
          if (myRole === "Witness" && (p.role === "Murderer" || p.role === "Accomplice")) {
            if (room.isDepersonalizationActive && p.role === "Murderer") {
              // Hide Murderer from Witness
            } else {
              return;
            }
          }

          // ── Murderer sees Accomplice + Lover ──
          if (myRole === "Murderer" && (p.role === "Accomplice" || p.role === "Lover")) return;
          if (myRole === "Accomplice" && p.role === "Murderer") return;
          if (
            (myRole === "Murderer" || myRole === "Accomplice") &&
            (p.role === "Murderer" || p.role === "Accomplice")
          ) {
            return;
          }

          // ── Lover sees ONLY Murderer (not Accomplice, not selection) ──
          if (myRole === "Lover" && p.role === "Murderer") return;

          // ── Phantom sees Accomplice + Lover (but NOT Murderer) ──
          if (myRole === "Phantom" && (p.role === "Accomplice" || p.role === "Lover")) return;

          // ── Detective sees Lover specifically, but Murderer/Accomplice are anonymous evil ──
          if (myRole === "Detective" && p.role === "Lover") return; // keep Lover's full role
          if (myRole === "Detective" && (p.role === "Murderer" || p.role === "Accomplice")) {
            p.role = undefined;
            p.team = "Murderer";
            return;
          }

          // Default: hide role and team
          delete p.role;
          delete p.team;
        }
      });
    }

    // ─── Hide other players' cards details during active game (optional — cards are public) ───
    // In Deception, everyone can see each other's cards (they're face up on the table)
    // So we do NOT hide cards — this is by design

    // ─── Keep auto-scored solving result private to forensic until confirmation ───
    if (clone.activeSolvingAttempt && me?.role !== "ForensicScientist") {
      clone.activeSolvingAttempt.result = "pending";
    }

    return clone;
  }
}
