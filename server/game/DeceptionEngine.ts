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
import {
  type DeceptionVoicePolicyReason,
  removeDeceptionVoiceRoom,
  upsertDeceptionVoiceRoom,
} from "./DeceptionVoiceRegistry";

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
      removeDeceptionVoiceRoom(roomId);
    }, 15000);

    this.emptyRoomCleanupTimers.set(roomId, timer);
  }

  private syncVoiceAccess(room: DeceptionRoom) {
    upsertDeceptionVoiceRoom({
      roomId: room.id,
      state: room.state,
      players: room.players.map((player) => ({
        userId: player.userId,
        role: player.role,
        status: player.status,
        isSpectator: Boolean(player.isSpectator),
      })),
    });
  }

  // ─── Role Assignment ───

  private getRoleCounts(numPlayers: number, settings: DeceptionSettings) {
    // FS:1 + Murderer:1 = always 2; rest are investigators
    // Accomplice & Witness added based on settings + player count
    const enableAccomplice = settings.enableAccomplice && numPlayers >= 6;
    const enableWitness = settings.enableWitness && numPlayers >= 6;

    const specialCount = 2 + (enableAccomplice ? 1 : 0) + (enableWitness ? 1 : 0);
    const investigators = numPlayers - specialCount;

    return { enableAccomplice, enableWitness, investigators };
  }

  private assignRoles(room: DeceptionRoom) {
    const activePlayers = this.getActivePlayers(room);
    const numPlayers = activePlayers.length;
    const { enableAccomplice, enableWitness, investigators } =
      this.getRoleCounts(numPlayers, room.settings);

    const roles: DeceptionRole[] = ["ForensicScientist", "Murderer"];
    if (enableAccomplice) roles.push("Accomplice");
    if (enableWitness) roles.push("Witness");
    for (let i = 0; i < investigators; i++) roles.push("Investigator");

    shuffle(roles);

    const roleToTeam = (role: DeceptionRole): DeceptionTeam => {
      if (role === "Murderer" || role === "Accomplice") return "Murderer";
      return "Investigator";
    };

    activePlayers.forEach((p, i) => {
      p.role = roles[i];
      p.team = roleToTeam(roles[i]);
      p.isReady = false;
      p.hasBadge = roles[i] !== "ForensicScientist"; // Everyone except forensic gets a badge
    });
  }

  // ─── Card Dealing ───

  private dealCards(room: DeceptionRoom) {
    const cardsPerPlayer = room.settings.meansCardsPerPlayer;
    const cluesPerPlayer = room.settings.clueCardsPerPlayer;

    // Only non-FS active players receive cards
    const receivers = room.players.filter(
      (p) => !p.isSpectator && p.role !== "ForensicScientist",
    );

    const totalMeansNeeded = receivers.length * cardsPerPlayer;
    const totalCluesNeeded = receivers.length * cluesPerPlayer;

    // Shuffle and deal from pools
    const meansPool = shuffle([...MEANS_CARDS]).slice(0, totalMeansNeeded);
    const cluePool = shuffle([...CLUE_CARDS]).slice(0, totalCluesNeeded);

    receivers.forEach((p, i) => {
      p.meansCards = meansPool.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
      p.clueCards = cluePool.slice(i * cluesPerPlayer, (i + 1) * cluesPerPlayer);
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

      // Forensic starts discussion timer
      socket.on("startDiscussion", () => {
        if (socket.data.roomId && socket.data.userId) {
          this.startDiscussion(socket.data.roomId, socket.data.userId);
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

      socket.on("transferHost", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId) {
          this.transferHost(socket.data.roomId, socket.data.userId, targetUserId);
        }
      });

      socket.on("voicePolicyDenied", (payload: { reason?: string }) => {
        if (socket.data.roomId && socket.data.userId) {
          this.reportVoicePolicyDenied(
            socket.data.roomId,
            socket.data.userId,
            payload?.reason,
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
          if (typeof callback === "function") callback(timestamp);
        },
      );
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
      },
      messages: [],
      murderSelection: null,
      activeSceneTiles: [],
      scenePool: [],
      replacedTileIndex: null,
      awaitingReplacementChoice: false,
      currentRound: 1,
      timerEndAt: null,
      timerPausedRemaining: null,
      solvingAttempts: [],
      activeSolvingAttempt: null,
      solvingResolutionNotice: null,
    });

    this.syncVoiceAccess(this.rooms.get(roomId)!);
  }

  public joinRoom(
    roomId: string,
    pData: { id: string; userId: string; name: string },
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
    if (activePlayers.length < 4 || activePlayers.length > 12) return;

    // Reset game state
    room.murderSelection = null;
    room.activeSceneTiles = [];
    room.scenePool = [];
    room.replacedTileIndex = null;
    room.awaitingReplacementChoice = false;
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
      room.state = "NIGHT_PHASE";
      this.addSystemMessage(room, "Đêm xuống... Kẻ sát nhân hãy chọn hung khí và manh mối.");
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

    // Validate that means & clue belong to the murderer's cards
    const hasMeans = player.meansCards.some((c) => c.id === selection.meansId);
    const hasClue = player.clueCards.some((c) => c.id === selection.clueId);
    if (!hasMeans || !hasClue) return;

    room.murderSelection = {
      meansId: selection.meansId,
      clueId: selection.clueId,
    };

    // Generate scene tiles
    const { active, pool } = generateSceneTiles();
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
    if (!room || (room.state !== "SCENE_SETUP" && room.state !== "DISCUSSION")) return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;
    if (room.awaitingReplacementChoice) return;

    const tile = room.activeSceneTiles.find((t) => t.id === payload.tileId);
    if (!tile) return;
    if (payload.optionIndex < 0 || payload.optionIndex >= tile.options.length) return;

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
    this.addSystemMessage(room, `Hiện trường đã sẵn sàng! Pháp y hãy bấm "Bắt đầu thảo luận".`);
    this.broadcastState(roomId);
  }

  // ─── Discussion + Timer ───

  public startDiscussion(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DISCUSSION") return;

    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "ForensicScientist") return;

    // Only start if timer hasn't been started yet this round
    if (room.timerEndAt) return;

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
      `Round ${room.currentRound} bắt đầu! Thời gian: ${room.settings.discussionTimeSeconds}s`,
    );
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
    if (!accused || accused.role === "ForensicScientist" || accused.userId === userId) return;

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
      room.timerEndAt = null;
      room.timerPausedRemaining = null;
      room.solvingResolutionNotice = null;
      this.clearSolvingNoticeTimer(roomId);

      if (witness) {
        room.state = "WITNESS_HUNT";
        room.winner = undefined;
        room.witnessHuntTarget = undefined;
        room.witnessHuntResult = undefined;
        this.addSystemMessage(
          room,
          `${attempt.investigatorName} đã phá án đúng! Kẻ sát nhân có cơ hội cuối cùng: săn nhân chứng.`,
        );
      } else {
        room.state = "GAME_OVER";
        room.winner = "Investigator";
        room.witnessHuntTarget = undefined;
        room.witnessHuntResult = undefined;
        this.addSystemMessage(room, `${attempt.investigatorName} đã phá án thành công! Phe Điều tra thắng!`);
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
    room.witnessHuntResult = target.role === "Witness" ? "correct" : "incorrect";
    room.state = "GAME_OVER";
    room.solvingResolutionNotice = null;
    this.clearSolvingNoticeTimer(roomId);

    if (room.witnessHuntResult === "correct") {
      room.winner = "Murderer";
      this.addSystemMessage(room, `Kẻ sát nhân đã tìm ra nhân chứng ${target.name}! Evil hoàn thắng!`);
    } else {
      room.winner = "Investigator";
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
    room.currentRound = 1;
    room.timerEndAt = null;
    room.timerPausedRemaining = null;
    room.solvingAttempts = [];
    room.activeSolvingAttempt = null;
    room.solvingResolutionNotice = null;
    room.winner = undefined;
    room.witnessHuntTarget = undefined;
    room.witnessHuntResult = undefined;

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

  private reportVoicePolicyDenied(
    roomId: string,
    userId: string,
    reasonRaw?: string,
  ) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = this.findPlayer(room, userId);
    if (!player) return;

    const reason = (reasonRaw ?? "unknown-user") as DeceptionVoicePolicyReason;
    const noticeKey = `${roomId}:${userId}:${reason}`;
    const now = Date.now();
    const lastAt = this.voicePolicyNoticeCooldown.get(noticeKey) ?? 0;

    // Avoid flooding game log when client reconnects/retries token repeatedly.
    if (now - lastAt < 15000) return;
    this.voicePolicyNoticeCooldown.set(noticeKey, now);

    let text = `${player.name}: quyền voice bị giới hạn bởi hệ thống.`;
    if (reason === "forensic-muted") {
      text = `${player.name}: Pháp y không được bật mic trong giai đoạn thảo luận.`;
    } else if (reason === "spectator") {
      text = `${player.name}: Spectator chỉ có thể nghe, không thể nói.`;
    } else if (reason === "disconnected") {
      text = `${player.name}: Mất kết nối, không thể bật voice publish.`;
    } else if (reason === "unknown-user") {
      text = `${player.name}: Phiên voice chưa hợp lệ với phòng hiện tại.`;
    }

    this.addSystemMessage(room, text);
    this.broadcastState(roomId);
  }

  // ─── Broadcast (role-based information hiding) ───

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      removeDeceptionVoiceRoom(roomId);
      return;
    }

    this.syncVoiceAccess(room);

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

    const isGameActive =
      room.state !== "LOBBY" &&
      room.state !== "GAME_OVER";

    const isGameOver = room.state === "GAME_OVER";

    // ─── Game Over: reveal everything ───
    if (isGameOver) {
      return clone;
    }

    // ─── Hide murder selection from most players ───
    if (clone.murderSelection) {
      const myRole = me?.role;
      const canSeeSolution =
        myRole === "ForensicScientist" ||
        myRole === "Accomplice" ||
        (myRole === "Murderer");

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
        if (!me || p.userId !== me.userId) {
          // What can current viewer see about this player?
          const myRole = me?.role;

          // Witness sees Murderer + Accomplice identities
          if (myRole === "Witness" && (p.role === "Murderer" || p.role === "Accomplice")) {
            // Keep role visible — witness knows who they are
            return;
          }

          // Murderer sees Accomplice
          if (myRole === "Murderer" && p.role === "Accomplice") {
            return;
          }

          // Accomplice sees Murderer
          if (myRole === "Accomplice" && p.role === "Murderer") {
            return;
          }

          // Evil sees each other
          if (
            (myRole === "Murderer" || myRole === "Accomplice") &&
            (p.role === "Murderer" || p.role === "Accomplice")
          ) {
            return;
          }

          // Everyone can see who is ForensicScientist (public role)
          if (p.role === "ForensicScientist") {
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
