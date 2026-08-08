import { Server, Socket, Namespace } from "socket.io";
import type {
  WeredogRoom,
  WeredogPlayer,
  WeredogRole,
  WeredogHistoryRecord,
} from "./WeredogTypes";
import { ROLE_CONFIGS } from "./WeredogTypes";
import {
  MAX_SPECTATORS_PER_ROOM,
  issueReconnectCapability,
  markConnectionAbandoned,
  markConnectionInterrupted,
  markConnectionRestored,
  stripConnectionMetadata,
  verifyReconnectCapability,
} from "./shared/connection";
import { disabledGameplayTimer } from "./shared/timing";

const MAX_WEREDOG_PLAYERS = 13;

export class WeredogEngine {
  private rooms: Map<string, WeredogRoom> = new Map();
  private io: Namespace;
  private chatRateLimits: Map<string, { count: number; resetAt: number }> = new Map();
  private emptyRoomCleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private broadcastDebounced: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(server: Server) {
    this.io = server.of("/weredog");
    this.setupListeners();
  }

  // ─── Constants ───
  
  private readonly MAX_HISTORY_RECORDS = 30; // Keep last 30 nights

  // ─── Performance Optimizations ───

  /**
   * Debounced broadcast: batches rapid state updates to ~60fps
   * Reduces broadcast storms during rapid actions (wolf voting, chat spam)
   */
  private scheduleBroadcast(roomId: string) {
    const existing = this.broadcastDebounced.get(roomId);
    if (existing) clearTimeout(existing);
    
    const timer = setTimeout(() => {
      this.broadcastDebounced.delete(roomId);
      this.broadcastStateImmediate(roomId);
    }, 16); // ~60fps batching
    
    this.broadcastDebounced.set(roomId, timer);
  }

  /**
   * Immediate broadcast: for critical updates that need instant feedback
   * Use for: game over, role reveal, critical errors
   */
  private broadcastStateImmediate(roomId: string) {
    this.broadcastState(roomId);
  }

  /**
   * Sync playerMap for O(1) lookups instead of O(n) array searches
   * Call after: join, leave, player state changes
   */
  private syncPlayerMap(room: WeredogRoom) {
    room.playerMap = new Map(room.players.map(p => [p.userId, p]));
  }

  /**
   * Clear broadcast debounce timer on room cleanup
   */
  private clearBroadcastDebounce(roomId: string) {
    const timer = this.broadcastDebounced.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.broadcastDebounced.delete(roomId);
    }
  }

  // ─── Helpers ───

  private uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }



  private getActivePlayers(room: WeredogRoom): WeredogPlayer[] {
    return room.players.filter((p) => !p.isSpectator && !p.isModerator);
  }

  /**
   * Invalidate alive players cache (call when player dies)
   */
  private invalidateAliveCache(room: WeredogRoom) {
    room._aliveCacheInvalidated = true;
  }

  private getAlivePlayers(room: WeredogRoom): WeredogPlayer[] {
    // Return cached result if valid
    if (!room._aliveCacheInvalidated && room._alivePlayersCache) {
      return room._alivePlayersCache;
    }
    
    // Recalculate and cache
    room._alivePlayersCache = this.getActivePlayers(room).filter((p) => p.isAlive);
    room._aliveCacheInvalidated = false;
    return room._alivePlayersCache;
  }

  private isLivingGamePlayer(player: WeredogPlayer | undefined): player is WeredogPlayer {
    return !!player && player.isAlive && !player.isModerator && !player.isSpectator;
  }

  private findPlayer(room: WeredogRoom, userId: string): WeredogPlayer | undefined {
    // O(1) lookup via map, fallback to O(n) array search
    return room.playerMap?.get(userId) ?? room.players.find((p) => p.userId === userId);
  }

  private findHost(room: WeredogRoom): WeredogPlayer | undefined {
    return room.players.find((p) => p.isHost);
  }

  private findModerator(room: WeredogRoom): WeredogPlayer | undefined {
    return room.players.find((p) => p.isModerator);
  }

  private clearEmptyRoomCleanup(roomId: string) {
    const timer = this.emptyRoomCleanupTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.emptyRoomCleanupTimers.delete(roomId);
    }
  }

  private scheduleEmptyRoomCleanup(roomId: string) {
    this.clearEmptyRoomCleanup(roomId);
    const timer = setTimeout(() => {
      const room = this.rooms.get(roomId);
      this.emptyRoomCleanupTimers.delete(roomId);
      if (!room) return;
      if (room.players.some((p) => p.status === "connected")) return;
      this.clearBroadcastDebounce(roomId);
      this.rooms.delete(roomId);
    }, 15000);
    this.emptyRoomCleanupTimers.set(roomId, timer);
  }

  // ─── Socket Listeners ───

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Weredog client connected:", socket.id);

      socket.use(([event], next) => {
        if (["checkRoom", "createRoom", "joinRoom"].includes(event)) return next();
        const roomId = socket.data.roomId as string | undefined;
        const userId = socket.data.userId as string | undefined;
        const player = roomId && userId
          ? this.rooms.get(roomId)?.players.find((candidate) => candidate.userId === userId)
          : undefined;
        if (!player || player.id !== socket.id || player.status !== "connected") {
          return next(new Error("UNAUTHORIZED_SESSION"));
        }
        if (
          player.isSpectator &&
          !["chatMessage", "changeName", "updateAvatar", "measurePing", "updatePing", "explicitLeave"].includes(event)
        ) {
          return next(new Error("SPECTATOR_ACTION_FORBIDDEN"));
        }
        next();
      });

      socket.on("checkRoom", (roomId: string, callback: (exists: boolean) => void) => {
        if (typeof callback === "function") callback(this.rooms.has(roomId));
      });

      socket.on("createRoom", (roomId: string, callback: (success: boolean) => void) => {
        if (this.rooms.has(roomId)) {
          if (typeof callback === "function") callback(false);
        } else {
          this.createRoom(roomId);
          if (typeof callback === "function") callback(true);
        }
      });

      socket.on("joinRoom", ({ roomId, playerName, userId, avatarUrl, reconnectToken }) => {
        if (!userId) return;
        this.joinRoom(roomId, { id: socket.id, userId, name: playerName, avatarUrl, reconnectToken }, socket);
      });

      socket.on("explicitLeave", (callback?: () => void) => {
        if (socket.data.roomId) this.explicitLeave(socket.data.roomId, socket);
        if (typeof callback === "function") callback();
      });

      socket.on("disconnect", () => {
        console.log("Weredog client disconnected:", socket.id);
        if (socket.data.roomId) this.leaveRoom(socket.data.roomId, socket.id);
      });

      socket.on("chatMessage", (text: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.chatMessage(socket.data.roomId, socket.data.userId, text);
      });

      socket.on("updateSettings", (settings) => {
        if (socket.data.roomId && socket.data.userId)
          this.updateSettings(socket.data.roomId, socket.data.userId, settings);
      });

      socket.on("startGame", () => {
        if (socket.data.roomId && socket.data.userId)
          this.startGame(socket.data.roomId, socket.data.userId, socket);
      });

      socket.on("playerReady", () => {
        if (socket.data.roomId && socket.data.userId)
          this.playerReady(socket.data.roomId, socket.data.userId);
      });

      // ── Night actions ──

      socket.on("wolfVote", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.wolfVote(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("wolfRevote", () => {
        if (socket.data.roomId && socket.data.userId)
          this.wolfRevote(socket.data.roomId, socket.data.userId);
      });

      socket.on("bodyguardProtect", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.bodyguardProtect(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("seerInspect", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.seerInspect(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("cupidPair", (payload: { userId1: string; userId2: string }) => {
        if (socket.data.roomId && socket.data.userId)
          this.cupidPair(socket.data.roomId, socket.data.userId, payload.userId1, payload.userId2);
      });

      socket.on("witchChooseAction", (action: "save" | "kill" | "none") => {
        if (socket.data.roomId && socket.data.userId)
          this.witchChooseAction(socket.data.roomId, socket.data.userId, action);
      });

      socket.on("witchUsePotion", (targetUserId?: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.witchUsePotion(socket.data.roomId, socket.data.userId, targetUserId);
      });

      // ── Host confirms ──

      socket.on("hostConfirmNightAction", () => {
        if (socket.data.roomId && socket.data.userId)
          this.hostConfirmNightAction(socket.data.roomId, socket.data.userId);
      });

      socket.on("hostDeclareWolfWin", () => {
        if (socket.data.roomId && socket.data.userId)
          this.hostDeclareWolfWin(socket.data.roomId, socket.data.userId);
      });

      socket.on("hostContinueAfterWolfParity", () => {
        if (socket.data.roomId && socket.data.userId)
          this.hostContinueAfterWolfParity(socket.data.roomId, socket.data.userId);
      });

      // ── Day actions ──

      socket.on("dayVote", (targetUserId: string | "skip") => {
        if (socket.data.roomId && socket.data.userId)
          this.dayVote(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("hunterShoot", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.hunterShoot(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("hostConfirmDayVote", () => {
        if (socket.data.roomId && socket.data.userId)
          this.hostConfirmDayVote(socket.data.roomId, socket.data.userId);
      });

      socket.on("startDayVoting", () => {
        if (socket.data.roomId && socket.data.userId)
          this.startDayVoting(socket.data.roomId, socket.data.userId);
      });

      socket.on("hostTiebreakerDecision", (decision: "revote" | "skip") => {
        if (socket.data.roomId && socket.data.userId)
          this.hostTiebreakerDecision(socket.data.roomId, socket.data.userId, decision);
      });

      // ── Lobby ──

      socket.on("returnToLobby", () => {
        if (socket.data.roomId && socket.data.userId)
          this.returnToLobby(socket.data.roomId, socket.data.userId);
      });

      socket.on("changeName", (newName: string) => {
        if (socket.data.roomId && socket.data.userId && typeof newName === "string")
          this.changeName(socket.data.roomId, socket.data.userId, newName.trim().slice(0, 12));
      });

      socket.on("updateAvatar", (avatarUrl: string | null) => {
        if (socket.data.roomId && socket.data.userId)
          this.updateAvatar(socket.data.roomId, socket.data.userId, avatarUrl);
      });

      socket.on("transferHost", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.transferHost(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("toggleSpectatorLobby", () => {
        if (socket.data.roomId && socket.data.userId)
          this.toggleSpectatorLobby(socket.data.roomId, socket.data.userId);
      });

      socket.on("measurePing", (timestamp: number, callback: (ts: number) => void) => {
        if (typeof callback === "function") callback(timestamp);
      });

      socket.on("updatePing", (userId: string, ping: number) => {
        if (socket.data.roomId && userId)
          socket.to(socket.data.roomId).emit("playerPing", userId, ping);
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
      timing: {
        roleReveal: disabledGameplayTimer(),
        wolfVote: disabledGameplayTimer(),
        bodyguard: disabledGameplayTimer(),
        seer: disabledGameplayTimer(),
        cupid: disabledGameplayTimer(),
        witch: disabledGameplayTimer(),
        dayVote: disabledGameplayTimer(),
      },
      settings: {
        wolfCount: 1,
        enabledRoles: [],
      },
      messages: [],
      messageStartIndex: 0,
      nightNumber: 0,
      activeNightRolesOrder: [],
      currentNightRoleIndex: -1,
      wolfVotes: {},
      deathsThisNight: [],
      dayVotes: {},
      tiebreakerActive: false,
      tiebreakerCandidates: [],
      history: [],
    });
  }

  public joinRoom(
    roomId: string,
    pData: { id: string; userId: string; name: string; avatarUrl?: string; reconnectToken?: string },
    socket: Socket,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit("weredogError", "Phòng không tồn tại hoặc đã bị giải tán!");
      return;
    }
    this.clearEmptyRoomCleanup(roomId);
    const room = this.rooms.get(roomId)!;

    const existing = room.players.find((p) => p.userId === pData.userId);
    if (existing) {
      const isCurrentSocket = existing.id === socket.id;
      if (
        !isCurrentSocket &&
        !verifyReconnectCapability(existing.reconnectTokenHash, pData.reconnectToken)
      ) {
        socket.emit("weredogError", "Không thể khôi phục ghế: reconnect capability không hợp lệ.");
        return;
      }
      if (!isCurrentSocket) {
        const previousSocket = this.io.sockets.get(existing.id);
        existing.id = pData.id;
        previousSocket?.emit("sessionReplaced");
        previousSocket?.disconnect(true);
      }
      existing.name = pData.name;
      if (pData.avatarUrl !== undefined) existing.avatarUrl = pData.avatarUrl;
      existing.status = "connected";
      markConnectionRestored(existing);
      this.clearReconnectGrace(roomId, existing.userId);
      const capability = issueReconnectCapability();
      existing.reconnectTokenHash = capability.reconnectTokenHash;
      socket.emit("sessionEstablished", { reconnectToken: capability.reconnectToken });
    } else {
      const isHost = room.players.length === 0;
      const isMidGame = room.state !== "LOBBY";
      if (!isMidGame && this.getActivePlayers(room).length >= MAX_WEREDOG_PLAYERS) {
        socket.emit("weredogError", `Phòng đã đủ ${MAX_WEREDOG_PLAYERS} người chơi.`);
        return;
      }
      if (
        isMidGame &&
        room.players.filter((player) => player.isSpectator).length >= MAX_SPECTATORS_PER_ROOM
      ) {
        socket.emit("weredogError", {
          code: "SPECTATOR_LIMIT_REACHED",
          message: `Phòng đã đủ ${MAX_SPECTATORS_PER_ROOM} khán giả.`,
        });
        return;
      }
      const capability = issueReconnectCapability();
      room.players.push({
        id: pData.id,
        userId: pData.userId,
        name: pData.name,
        avatarUrl: pData.avatarUrl,
        isHost: isHost && !isMidGame,
        isModerator: isHost && !isMidGame,
        isSpectator: isMidGame,
        isReady: false,
        status: "connected",
        connectionState: "connected",
        reconnectTokenHash: capability.reconnectTokenHash,
        isAlive: true,
        witchHasSaveBottle: true,
        witchHasKillBottle: true,
        elderLives: 2,
        isLover: false,
      });
      socket.emit("sessionEstablished", { reconnectToken: capability.reconnectToken });
    }

    socket.data.roomId = roomId;
    socket.data.userId = pData.userId;
    socket.join(roomId);
    this.syncPlayerMap(room);
    this.scheduleBroadcast(roomId);
  }

  private leaveRoom(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const pIndex = room.players.findIndex((p) => p.id === socketId);
    if (pIndex === -1) return;
    const player = room.players[pIndex];

    // Lobby seats are not recoverable: closing a browser tab immediately removes
    // the player, while in-progress matches retain the reconnect grace policy.
    if (room.state === "LOBBY") {
      this.clearReconnectGrace(roomId, player.userId);
      room.players.splice(pIndex, 1);

      if (player.isHost) {
        const successor = room.players.find(
          (candidate) => candidate.status === "connected" && !candidate.isSpectator,
        );
        if (successor) {
          successor.isHost = true;
          successor.isModerator = true;
        }
      }

      this.syncPlayerMap(room);
      if (room.players.length === 0) {
        this.scheduleEmptyRoomCleanup(roomId);
      }
      this.scheduleBroadcast(roomId);
      return;
    }

    player.status = "disconnected";
    markConnectionInterrupted(player);
    this.scheduleReconnectGrace(roomId, player.userId);

    // If wolf disconnected mid-vote, check if remaining wolves all voted
    if (room.state === "NIGHT_ACTION" && room.currentNightActiveRole === "Wolf" && player.role === "Wolf") {
      this.checkWolfVoteComplete(roomId, room);
    }

    this.scheduleBroadcast(roomId);
  }

  // ─── Chat ───

  private explicitLeave(roomId: string, socket: Socket) {
    const room = this.rooms.get(roomId);
    const player = room?.players.find((candidate) => candidate.id === socket.id);
    if (!room || !player) return;
    this.clearReconnectGrace(roomId, player.userId);

    if (player.isModerator) {
      const successor = room.players.find(
        (candidate) =>
          candidate.userId !== player.userId &&
          candidate.isModerator &&
          candidate.status === "connected" &&
          !candidate.isSpectator &&
          !candidate.role,
      );
      if (successor) player.isModerator = false;
      // No eligible pre-existing non-player moderator: keep the authority on the
      // abandoned record so moderator-only progression remains paused securely.
    }

    if (room.state !== "LOBBY" && !player.isSpectator && !player.isHost) {
      player.status = "disconnected";
      markConnectionAbandoned(player);
    } else {
      if (room.state !== "LOBBY" && player.isHost) {
        this.returnToLobby(roomId, player.userId);
      }
      room.players = room.players.filter((candidate) => candidate.userId !== player.userId);
      this.syncPlayerMap(room);
      if (room.players.length === 0) {
        this.scheduleEmptyRoomCleanup(roomId);
      } else if (player.isHost) {
        const nextHost = room.players.find(
          (candidate) => candidate.status === "connected" && !candidate.isSpectator,
        );
        if (nextHost) nextHost.isHost = true;
      }
    }

    socket.leave(roomId);
    delete socket.data.roomId;
    delete socket.data.userId;
    this.scheduleBroadcast(roomId);
  }

  private scheduleReconnectGrace(roomId: string, userId: string) {
    this.clearReconnectGrace(roomId, userId);
    const key = `${roomId}:${userId}`;
    const player = this.rooms.get(roomId)?.players.find((candidate) => candidate.userId === userId);
    const delay = Math.max(0, (player?.reconnectDeadlineAt ?? Date.now()) - Date.now());
    const timer = setTimeout(() => {
      this.reconnectGraceTimers.delete(key);
      const room = this.rooms.get(roomId);
      const current = room?.players.find((candidate) => candidate.userId === userId);
      if (!room || !current || current.connectionState !== "temporarily_disconnected") return;
      markConnectionAbandoned(current);
      if (current.isModerator) {
        const successor = room.players.find(
          (candidate) =>
            candidate.userId !== current.userId &&
            candidate.isModerator &&
            candidate.status === "connected" &&
            !candidate.isSpectator &&
            !candidate.role,
        );
        if (successor) current.isModerator = false;
      }
      if (current.isHost) {
        current.isHost = false;
        const nextHost = room.players.find(
          (candidate) => candidate.status === "connected" && !candidate.isSpectator,
        );
        if (nextHost) nextHost.isHost = true;
      }
      if (room.state === "LOBBY") {
        room.players = room.players.filter((candidate) => candidate.userId !== userId);
        this.syncPlayerMap(room);
        if (room.players.length === 0) {
          this.scheduleEmptyRoomCleanup(roomId);
          return;
        }
      }
      this.scheduleBroadcast(roomId);
    }, delay);
    this.reconnectGraceTimers.set(key, timer);
  }

  private clearReconnectGrace(roomId: string, userId: string) {
    const key = `${roomId}:${userId}`;
    const timer = this.reconnectGraceTimers.get(key);
    if (timer) clearTimeout(timer);
    this.reconnectGraceTimers.delete(key);
  }

  private chatMessage(roomId: string, userId: string, text: string) {
    if (!text || text.length > 500) return;
    
    // O(1) rate limiting with counter and time window
    const now = Date.now();
    const limit = this.chatRateLimits.get(userId);
    
    if (limit) {
      if (now < limit.resetAt) {
        if (limit.count >= 10) return; // Rate limited
        limit.count++;
      } else {
        // Reset window expired, start new window
        limit.count = 1;
        limit.resetAt = now + 10000;
      }
    } else {
      this.chatRateLimits.set(userId, { count: 1, resetAt: now + 10000 });
    }

    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = this.findPlayer(room, userId);
    if (!player) return;

    room.messages.push({
      senderId: player.userId,
      senderName: player.name,
      text,
      timestamp: Date.now(),
    });
    
    // Use circular buffer: track start index instead of shifting
    if (room.messages.length > 50) {
      room.messageStartIndex = (room.messageStartIndex || 0) + 1;
    }
    
    this.scheduleBroadcast(roomId);
  }

  // ─── Settings ───

  private updateSettings(roomId: string, userId: string, settings: Partial<WeredogRoom["settings"]>) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    if (settings.wolfCount !== undefined) {
      const activePlayersCount = room.players.filter((p) => !p.isSpectator && !p.isModerator).length;
      const maxWolves = Math.max(1, Math.floor((activePlayersCount - 1) / 2));
      settings.wolfCount = Math.max(1, Math.min(maxWolves, settings.wolfCount));
    }
    if (settings.enabledRoles !== undefined) {
      const validRoles: WeredogRole[] = ["Bodyguard", "Seer", "Hunter", "Cupid", "Witch", "Elder", "Silence"];
      settings.enabledRoles = [...new Set(settings.enabledRoles.filter((r) => validRoles.includes(r)))];
    }

    room.settings = { ...room.settings, ...settings };
    this.scheduleBroadcast(roomId);
  }

  // ─── Lobby Actions ───

  private toggleSpectatorLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.isHost || player.isModerator) return;
    player.isSpectator = !player.isSpectator;
    this.scheduleBroadcast(roomId);
  }

  private changeName(roomId: string, userId: string, newName: string) {
    const room = this.rooms.get(roomId);
    if (!room || !newName) return;
    const player = this.findPlayer(room, userId);
    if (player) {
      player.name = newName;
      this.broadcastState(roomId);
    }
  }

  private updateAvatar(roomId: string, userId: string, avatarUrl: string | null) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = this.findPlayer(room, userId);
    if (player) {
      player.avatarUrl = avatarUrl ?? undefined;
      this.broadcastState(roomId);
    }
  }

  private transferHost(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;
    const target = this.findPlayer(room, targetUserId);
    if (
      !target ||
      target.userId === userId ||
      target.isSpectator ||
      target.status !== "connected"
    ) return;

    player.isHost = false;
    target.isHost = true;
    this.broadcastState(roomId);
  }

  private playerReady(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "ROLE_REVEAL") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.isModerator || player.isSpectator) return;

    player.isReady = true;

    const activePlayers = this.getActivePlayers(room);
    if (activePlayers.every((p) => p.isReady)) {
      this.beginNight(roomId, room);
    }
    this.broadcastState(roomId);
  }

  private returnToLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    room.state = "LOBBY";
    room.nightNumber = 0;
    room.messageStartIndex = 0;
    room.wolfVotes = {};
    room.wolfVictimUserId = undefined;
    room.bodyguardTargetUserId = undefined;
    room.seerTargetUserId = undefined;
    room.seerResult = undefined;
    room.witchActionSelected = undefined;
    room.witchTargetUserId = undefined;
    room.pendingHunterShotUserId = undefined;
    room.hunterShotTargetUserId = undefined;
    room.dayStartNextAction = undefined;
    room.cupidLoverUserIds = undefined;
    room.cupidLoversConfirmed = undefined;
    room.deathsThisNight = [];
    room.dayVotes = {};
    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];
    room.activeNightRolesOrder = [];
    room.currentNightRoleIndex = -1;
    room.currentNightActiveRole = undefined;
    room.history = [];
    room.winner = undefined;
    room.wolfParityPending = false;
    room.wolfParityAcknowledgedKey = undefined;

    room.players = room.players.filter((p) => p.status === "connected");
    room.players.forEach((p) => {
      delete p.role;
      p.isReady = false;
      p.isAlive = true;
      p.isLover = false;
      p.loverUserId = undefined;
      p.protectedLastNightUserId = undefined;
      p.witchHasSaveBottle = true;
      p.witchHasKillBottle = true;
      p.elderLives = 2;
      p.hasVoted = false;
      if (!p.isModerator) p.isSpectator = false;
    });
    this.invalidateAliveCache(room);

    this.broadcastState(roomId);
  }

  // ─── Game Start & Role Assignment ───

  private startGame(roomId: string, userId: string, socket?: Socket) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") {
      if (socket) socket.emit("weredogError", "Phòng không ở trạng thái chờ!");
      return;
    }
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) {
      if (socket) socket.emit("weredogError", "Chỉ có Host mới có quyền bắt đầu game!");
      return;
    }

    const moderator = this.findModerator(room);
    if (!moderator || moderator.status !== "connected") {
      if (socket) socket.emit("weredogError", "Cần một quản trò đang kết nối để bắt đầu game.");
      return;
    }

    const activePlayers = this.getActivePlayers(room);
    const totalPlayers = activePlayers.length;
    if (totalPlayers < 2) {
      if (socket) socket.emit("weredogError", `Cần tối thiểu 2 người chơi để bắt đầu! Hiện tại: ${totalPlayers}`);
      return;
    }
    if (totalPlayers > MAX_WEREDOG_PLAYERS) {
      if (socket) socket.emit("weredogError", `Phòng chỉ hỗ trợ tối đa ${MAX_WEREDOG_PLAYERS} người chơi.`);
      return;
    }
    const maxWolvesLimit = Math.max(1, Math.floor((totalPlayers - 1) / 2));
    if (room.settings.wolfCount > maxWolvesLimit) {
      if (socket) socket.emit("weredogError", `Số lượng Sói (${room.settings.wolfCount}) vượt quá giới hạn tối đa cho ${totalPlayers} người chơi (Tối đa: ${maxWolvesLimit})`);
      return;
    }

    // Assign roles
    const roles: WeredogRole[] = [];
    for (let i = 0; i < room.settings.wolfCount; i++) roles.push("Wolf");
    for (const r of room.settings.enabledRoles) roles.push(r);
    if (roles.length > totalPlayers) {
      if (socket) socket.emit("weredogError", `Số vai tro (${roles.length}) vuot qua so nguoi choi (${totalPlayers}). Hay giam bot vai tro dac biet hoac so soi.`);
      return;
    }
    while (roles.length < totalPlayers) roles.push("Villager");
    // Shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    activePlayers.forEach((p, i) => {
      p.role = roles[i];
      p.isAlive = true;
      p.isReady = false;
      p.isLover = false;
      p.loverUserId = undefined;
      p.protectedLastNightUserId = undefined;
      p.witchHasSaveBottle = true;
      p.witchHasKillBottle = true;
      p.elderLives = p.role === "Elder" ? 2 : 0;
      p.hasVoted = false;
    });
    this.invalidateAliveCache(room);

    room.state = "ROLE_REVEAL";
    room.nightNumber = 0;
    room.history = [];
    room.winner = undefined;
    room.wolfParityPending = false;
    room.wolfParityAcknowledgedKey = undefined;
    room.pendingHunterShotUserId = undefined;
    room.hunterShotTargetUserId = undefined;
    room.dayStartNextAction = undefined;
    room.cupidLoverUserIds = undefined;
    room.cupidLoversConfirmed = undefined;

    this.broadcastState(roomId);
  }

  // ─── Night Phase ───

  private beginNight(roomId: string, room: WeredogRoom) {
    room.nightNumber++;
    room.state = "NIGHT_ACTION";

    // Reset night state
    room.wolfVotes = {};
    room.wolfVictimUserId = undefined;
    room.bodyguardTargetUserId = undefined;
    room.seerTargetUserId = undefined;
    room.seerResult = undefined;
    room.witchActionSelected = undefined;
    room.witchTargetUserId = undefined;
    room.pendingHunterShotUserId = undefined;
    room.hunterShotTargetUserId = undefined;
    room.dayStartNextAction = undefined;
    room.deathsThisNight = [];

    // Determine night action order based on assigned roles (alive or dead) with nightPriority
    const assignedRoles = new Set(this.getActivePlayers(room).map((p) => p.role!));
    const nightRoles: WeredogRole[] = [];

    // Cupid only on night 1
    if (room.nightNumber === 1 && assignedRoles.has("Cupid")) {
      nightRoles.push("Cupid");
    }
    if (assignedRoles.has("Bodyguard")) nightRoles.push("Bodyguard");
    if (assignedRoles.has("Wolf")) nightRoles.push("Wolf");
    if (assignedRoles.has("Seer")) nightRoles.push("Seer");
    if (assignedRoles.has("Witch")) nightRoles.push("Witch");

    // Sort by nightPriority
    nightRoles.sort((a, b) => ROLE_CONFIGS[a].nightPriority - ROLE_CONFIGS[b].nightPriority);

    room.activeNightRolesOrder = nightRoles;
    room.currentNightRoleIndex = 0;
    room.currentNightActiveRole = nightRoles[0] ?? undefined;

    // If no night roles (shouldn't happen normally), skip to day
    if (nightRoles.length === 0) {
      this.resolveMorning(roomId, room);
      return;
    }

    this.broadcastState(roomId);
  }

  private advanceNightRole(roomId: string, room: WeredogRoom) {
    if (room.currentNightActiveRole === "Cupid" && room.cupidLoverUserIds && room.cupidLoverUserIds.length === 2) {
      room.cupidLoversConfirmed = true;
    }

    room.currentNightRoleIndex++;

    if (room.currentNightRoleIndex >= room.activeNightRolesOrder.length) {
      // All night roles done, resolve morning
      room.currentNightActiveRole = undefined;
      this.resolveMorning(roomId, room);
      return;
    }

    room.currentNightActiveRole = room.activeNightRolesOrder[room.currentNightRoleIndex];
    this.broadcastState(roomId);
  }

  // ── Wolf Vote ──

  private isCurrentNightRoleResolved(room: WeredogRoom): boolean {
    const role = room.currentNightActiveRole;
    if (!role) return false;

    if (role === "Wolf") {
      const connectedAliveWolves = this.getAlivePlayers(room).filter((p) => p.role === "Wolf");
      if (connectedAliveWolves.length === 0) return true;
      return room.wolfVictimUserId !== undefined;
    }

    const actor = this.getActivePlayers(room).find((p) => p.role === role);
    if (!actor || !actor.isAlive) return true;
    if (actor.status !== "connected") return false;
    if (this.isElderDead(room)) return true;

    switch (role) {
      case "Cupid":
        return room.nightNumber !== 1 || (!!room.cupidLoverUserIds && room.cupidLoverUserIds.length === 2);
      case "Bodyguard":
        return !!room.bodyguardTargetUserId;
      case "Seer":
        return !!room.seerTargetUserId;
      case "Witch":
        return room.witchActionSelected === "none" || !!room.witchTargetUserId;
      default:
        return true;
    }
  }

  private wolfVote(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Wolf") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Wolf" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!this.isLivingGamePlayer(target)) return;

    room.wolfVotes[userId] = targetUserId;
    this.scheduleBroadcast(roomId);

    this.checkWolfVoteComplete(roomId, room);
  }

  private checkWolfVoteComplete(roomId: string, room: WeredogRoom) {
    const aliveWolves = this.getAlivePlayers(room).filter((p) => p.role === "Wolf");
    const allVoted = aliveWolves.every((w) => room.wolfVotes[w.userId]);
    if (!allVoted) return;

    // Tally votes
    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(room.wolfVotes)) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    const maxVotes = Math.max(...Object.values(voteCounts));
    const topTargets = Object.entries(voteCounts).filter(([, c]) => c === maxVotes);

    if (topTargets.length === 1) {
      room.wolfVictimUserId = topTargets[0][0];
    } else {
      room.wolfVictimUserId = null; // Tie = no one dies
    }

    this.scheduleBroadcast(roomId);
  }

  private wolfRevote(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Wolf") return;
    const player = this.findPlayer(room, userId);
    if (!player) return;

    // Allow if player is a live Wolf OR if they are the Host (to resolve a tie)
    const isAllowed = (player.role === "Wolf" && player.isAlive) || player.isModerator;
    if (!isAllowed) return;

    // Only allow revote if wolves have finished voting (either decided a victim or tied)
    if (room.wolfVictimUserId === undefined) return;

    room.wolfVotes = {};
    room.wolfVictimUserId = undefined;
    this.broadcastState(roomId);
  }

  // ── Bodyguard ──

  private bodyguardProtect(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Bodyguard") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Bodyguard" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!this.isLivingGamePlayer(target)) return;

    // Cannot protect same person two nights in a row
    if (player.protectedLastNightUserId === targetUserId) return;

    room.bodyguardTargetUserId = targetUserId;

    this.broadcastState(roomId);
  }

  // ── Seer ──

  private seerInspect(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Seer") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Seer" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!this.isLivingGamePlayer(target) || target.userId === userId) return;

    room.seerTargetUserId = targetUserId;
    room.seerResult = target.role === "Wolf" ? "Wolf" : "Human";

    this.broadcastState(roomId);
  }

  // ── Hunter ──

  // ── Cupid ──

  private cupidPair(roomId: string, userId: string, userId1: string, userId2: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Cupid") return;
    if (room.nightNumber !== 1) return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Cupid" || !player.isAlive) return;
    if (userId1 === userId2) return;

    const p1 = this.findPlayer(room, userId1);
    const p2 = this.findPlayer(room, userId2);
    if (!this.isLivingGamePlayer(p1) || !this.isLivingGamePlayer(p2)) return;

    room.cupidLoverUserIds = [userId1, userId2];
    p1.isLover = true;
    p1.loverUserId = userId2;
    p2.isLover = true;
    p2.loverUserId = userId1;

    this.broadcastState(roomId);
  }

  // ── Witch ──

  private witchChooseAction(roomId: string, userId: string, action: "save" | "kill" | "none") {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Witch") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Witch" || !player.isAlive) return;

    if (action === "save" && !player.witchHasSaveBottle) return;
    if (action === "kill" && !player.witchHasKillBottle) return;

    room.witchActionSelected = action;

    if (action === "save") {
      // If no one was bitten, witch loses turn but not potion
      if (!room.wolfVictimUserId) {
        room.witchActionSelected = "none";
        room.witchTargetUserId = undefined;
      }
      // If someone was bitten, client will show who — witch then calls witchUsePotion
    }

    if (action === "none") {
    }

    this.broadcastState(roomId);
  }

  private witchUsePotion(roomId: string, userId: string, targetUserId?: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Witch") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Witch" || !player.isAlive) return;

    if (room.witchActionSelected === "save") {
      // Save the bitten person (targetUserId is implicit: wolfVictimUserId)
      if (!room.wolfVictimUserId) return;
      room.witchTargetUserId = room.wolfVictimUserId ?? undefined;
      player.witchHasSaveBottle = false;
    } else if (room.witchActionSelected === "kill" && targetUserId) {
      const target = this.findPlayer(room, targetUserId);
      if (!this.isLivingGamePlayer(target) || target.userId === userId) return;
      room.witchTargetUserId = targetUserId;
      player.witchHasKillBottle = false;
    } else {
      return;
    }

    this.broadcastState(roomId);
  }

  // ── Host Confirm Night Action ──

  private hostConfirmNightAction(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;
    if (!this.isCurrentNightRoleResolved(room)) return;

    this.advanceNightRole(roomId, room);
    this.broadcastState(roomId);
  }

  // ─── Morning Resolution ───

  private resolveMorning(roomId: string, room: WeredogRoom) {
    const deaths: string[] = [];

    const isElderDead = this.isElderDead(room);

    // 1. Wolf bite
    let wolfVictim = room.wolfVictimUserId ?? null;

    // Check bodyguard protection (only if Elder is alive)
    if (!isElderDead && wolfVictim && room.bodyguardTargetUserId === wolfVictim) {
      wolfVictim = null; // Protected
    }

    // Check witch save (only if Elder is alive)
    if (!isElderDead && wolfVictim && room.witchActionSelected === "save" && room.witchTargetUserId === wolfVictim) {
      wolfVictim = null; // Saved
    }

    // Apply wolf bite
    if (wolfVictim) {
      const victim = this.findPlayer(room, wolfVictim);
      if (victim && victim.isAlive) {
        if (victim.role === "Elder" && victim.elderLives > 1) {
          victim.elderLives--;
          // Elder survives, but still counts as "bitten" for history
        } else {
          this.killPlayer(room, victim, deaths);
        }
      }
    }

    // 2. Witch kill (only if Elder is alive)
    if (!isElderDead && room.witchActionSelected === "kill" && room.witchTargetUserId) {
      const witchTarget = this.findPlayer(room, room.witchTargetUserId);
      if (witchTarget && witchTarget.isAlive && !deaths.includes(witchTarget.userId)) {
        this.killPlayer(room, witchTarget, deaths);
      }
    }

    // 3. Cupid heartbreak: if one lover died, the other dies too
    this.resolveHeartbreak(room, deaths);

    // Update bodyguard tracking
    const bodyguard = this.getActivePlayers(room).find((p) => p.role === "Bodyguard");
    if (bodyguard) {
      bodyguard.protectedLastNightUserId = room.bodyguardTargetUserId ?? undefined;
    }

    // Record history
    const record: WeredogHistoryRecord = {
      nightNumber: room.nightNumber,
      wolfVictimUserId: room.wolfVictimUserId,
      bodyguardTargetUserId: room.bodyguardTargetUserId,
      seerTargetUserId: room.seerTargetUserId,
      seerResult: room.seerResult,
      witchAction: room.witchActionSelected ?? "none",
      witchTargetUserId: room.witchTargetUserId,
      hunterShotTargetUserId: room.hunterShotTargetUserId,
    };
    if (room.nightNumber === 1 && room.cupidLoverUserIds) {
      record.cupidLovers = [...room.cupidLoverUserIds];
    }
    room.history.push(record);
    
    // Limit history size to prevent unbounded growth
    if (room.history.length > this.MAX_HISTORY_RECORDS) {
      room.history.shift();
    }

    room.deathsThisNight = deaths;

    if (this.applyImmediateWinner(roomId, room)) {
      return;
    }

    const pendingHunterShotUserId = this.findPendingHunterShot(room, deaths, !isElderDead);
    if (pendingHunterShotUserId) {
      room.pendingHunterShotUserId = pendingHunterShotUserId;
      room.hunterShotTargetUserId = undefined;
      room.dayStartNextAction = "vote";
      room.state = "DAY_START";
      room.dayVotes = {};
      room.tiebreakerActive = false;
      room.tiebreakerCandidates = [];
      this.broadcastState(roomId);
      return;
    }

    this.markWolfParityIfNeeded(room);

    // Transition to day
    room.state = "DAY_START";
    room.dayStartNextAction = "vote";
    room.dayVotes = {};
    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];

    this.broadcastState(roomId);
  }

  private findPendingHunterShot(room: WeredogRoom, deaths: string[], canShoot: boolean): string | null {
    if (!canShoot) return null;
    const hunter = this.getActivePlayers(room).find((p) => p.role === "Hunter");
    if (!hunter || !deaths.includes(hunter.userId)) return null;
    return hunter.userId;
  }

  private applyImmediateWinner(roomId: string, room: WeredogRoom): boolean {
    const winner = this.checkWinCondition(room);
    if (!winner) return false;

    room.winner = winner;
    room.wolfParityPending = false;
    room.state = "GAME_OVER";
    this.broadcastState(roomId);
    return true;
  }

  private wolfParityKey(room: WeredogRoom): string | null {
    const alive = this.getAlivePlayers(room);
    const wolves = alive.filter((p) => p.role === "Wolf");
    const nonWolves = alive.filter((p) => p.role !== "Wolf");
    if (wolves.length === 0 || wolves.length < nonWolves.length) return null;
    return alive.map((p) => p.userId).sort().join("|");
  }

  private markWolfParityIfNeeded(room: WeredogRoom) {
    const key = this.wolfParityKey(room);
    room.wolfParityPending = !!key && room.wolfParityAcknowledgedKey !== key;
  }

  private hostDeclareWolfWin(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "LOBBY" || room.state === "GAME_OVER") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;

    room.winner = "Wolf";
    room.wolfParityPending = false;
    room.state = "GAME_OVER";
    this.broadcastState(roomId);
  }

  private hostContinueAfterWolfParity(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.wolfParityPending) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;

    const key = this.wolfParityKey(room);
    if (key) room.wolfParityAcknowledgedKey = key;
    room.wolfParityPending = false;
    this.broadcastState(roomId);
  }

  private hunterShoot(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DAY_START") return;
    if (room.pendingHunterShotUserId !== userId) return;
    const hunter = this.findPlayer(room, userId);
    if (!hunter || hunter.role !== "Hunter") return;
    const target = this.findPlayer(room, targetUserId);
    if (!this.isLivingGamePlayer(target) || target.userId === userId) return;

    const deaths = [...room.deathsThisNight];
    room.hunterShotTargetUserId = targetUserId;
    this.killPlayer(room, target, deaths);
    this.resolveHeartbreak(room, deaths);
    room.deathsThisNight = [...new Set(deaths)];
    room.pendingHunterShotUserId = undefined;

    if (this.applyImmediateWinner(roomId, room)) {
      return;
    }
    this.markWolfParityIfNeeded(room);

    if (room.dayStartNextAction === "night") {
      if (room.wolfParityPending) {
        room.state = "DAY_START";
        this.broadcastState(roomId);
        return;
      }
      this.transitionToNight(roomId, room);
      return;
    }

    room.dayStartNextAction = "vote";
    this.broadcastState(roomId);
  }

  private killPlayer(room: WeredogRoom, player: WeredogPlayer, deaths: string[]) {
    if (!player.isAlive) return;
    player.isAlive = false;
    if (!deaths.includes(player.userId)) deaths.push(player.userId);
    
    // Invalidate alive players cache
    this.invalidateAliveCache(room);

    // If Elder dies, disable all non-wolf abilities
    if (player.role === "Elder") {
      // Elder is dead — flag handled by isElderDead() check
    }
  }

  private resolveHeartbreak(room: WeredogRoom, deaths: string[]) {
    if (!room.cupidLoverUserIds || room.cupidLoverUserIds.length !== 2) return;
    const [id1, id2] = room.cupidLoverUserIds;
    const p1 = this.findPlayer(room, id1);
    const p2 = this.findPlayer(room, id2);
    if (!p1 || !p2) return;

    if (deaths.includes(id1) && p2.isAlive && !deaths.includes(id2)) {
      this.killPlayer(room, p2, deaths);
    } else if (deaths.includes(id2) && p1.isAlive && !deaths.includes(id1)) {
      this.killPlayer(room, p1, deaths);
    }
  }

  private isElderDead(room: WeredogRoom): boolean {
    const elder = this.getActivePlayers(room).find((p) => p.role === "Elder");
    return elder ? !elder.isAlive : false;
  }

  // ─── Day Voting ───

  private dayVote(roomId: string, userId: string, targetUserId: string | "skip" | "cancel") {
    const room = this.rooms.get(roomId);
    if (!room || (room.state !== "DAY_START" && room.state !== "DAY_VOTING")) return;
    if (room.pendingHunterShotUserId || room.wolfParityPending) return;
    const player = this.findPlayer(room, userId);
    if (!player || !player.isAlive || player.isModerator || player.isSpectator) return;

    room.state = "DAY_VOTING";

    if (targetUserId === "cancel") {
      delete room.dayVotes[userId];
      player.hasVoted = false;
    } else {
      if (targetUserId !== "skip") {
        const target = this.findPlayer(room, targetUserId);
        if (!this.isLivingGamePlayer(target)) return;
      }
      room.dayVotes[userId] = targetUserId;
      player.hasVoted = true;

    }

    this.scheduleBroadcast(roomId);
  }

  private hostConfirmDayVote(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DAY_VOTING") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;

    // Verify all alive players have voted (or disconnected)
    const aliveVoters = this.getAlivePlayers(room);
    const allVoted = aliveVoters.every((p) => room.dayVotes[p.userId] !== undefined);
    if (!allVoted) return;

    this.resolveDayVote(roomId, room);
  }

  private resolveDayVote(roomId: string, room: WeredogRoom) {
    // Tally votes (Elder counts as 2)
    const voteCounts: Record<string, number> = {}; // targetUserId|'skip' -> count
    for (const [voterUserId, target] of Object.entries(room.dayVotes)) {
      const voter = this.findPlayer(room, voterUserId);
      if (!voter || !voter.isAlive) continue;
      const weight = voter.role === "Elder" && voter.isAlive ? 2 : 1;
      voteCounts[target] = (voteCounts[target] || 0) + weight;
    }

    const entries = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      // No votes, skip
      this.transitionToNight(roomId, room);
      return;
    }

    const topVote = entries[0][1];
    const topCandidates = entries.filter(([, c]) => c === topVote);

    // If only 'skip' is top or all tied with skip included: skip
    if (topCandidates.length === 1 && topCandidates[0][0] === "skip") {
      this.transitionToNight(roomId, room);
      return;
    }

    if (topCandidates.length === 1) {
      // Clear winner
      const victimId = topCandidates[0][0];
      if (victimId === "skip") {
        this.transitionToNight(roomId, room);
        return;
      }
      this.executeHanging(roomId, room, victimId);
      return;
    }

    // Tie between top candidates (excluding if one is just 'skip')
    const nonSkipCandidates = topCandidates.filter(([id]) => id !== "skip");

    if (nonSkipCandidates.length === 0) {
      // All top votes are skip
      this.transitionToNight(roomId, room);
      return;
    }

    if (nonSkipCandidates.length === 1) {
      // Only one non-skip candidate at top
      this.executeHanging(roomId, room, nonSkipCandidates[0][0]);
      return;
    }

    // Multiple non-skip candidates tied: host decides
    room.tiebreakerActive = true;
    room.tiebreakerCandidates = nonSkipCandidates.map(([id]) => id);
    this.broadcastState(roomId);
  }

  private hostTiebreakerDecision(roomId: string, userId: string, decision: "revote" | "skip") {
    const room = this.rooms.get(roomId);
    if (!room || !room.tiebreakerActive) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;

    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];

    if (decision === "skip") {
      this.transitionToNight(roomId, room);
    } else {
      // Revote: reset day votes
      room.dayVotes = {};
      room.state = "DAY_VOTING";
      this.getAlivePlayers(room).forEach((p) => (p.hasVoted = false));
      this.broadcastState(roomId);
    }
  }

  private startDayVoting(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DAY_START") return;
    if (room.pendingHunterShotUserId || room.wolfParityPending) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isModerator) return;

    if (room.dayStartNextAction === "night") {
      if (room.wolfParityPending) {
        this.broadcastState(roomId);
        return;
      }
      this.transitionToNight(roomId, room);
      return;
    }

    room.state = "DAY_VOTING";
    this.broadcastState(roomId);
  }

  private executeHanging(roomId: string, room: WeredogRoom, victimId: string) {
    const deaths: string[] = [];
    const victim = this.findPlayer(room, victimId);
    if (victim && victim.isAlive) {
      const hunterCanShoot = victim.role === "Hunter" && !this.isElderDead(room);
      this.killPlayer(room, victim, deaths);

      // Cupid heartbreak
      this.resolveHeartbreak(room, deaths);

      room.deathsThisNight = deaths;
      if (this.applyImmediateWinner(roomId, room)) {
        return;
      }

      const pendingHunterShotUserId = this.findPendingHunterShot(room, deaths, hunterCanShoot);
      if (pendingHunterShotUserId) {
        room.pendingHunterShotUserId = pendingHunterShotUserId;
        room.hunterShotTargetUserId = undefined;
        room.dayStartNextAction = "night";
        room.state = "DAY_START";
        room.dayVotes = {};
        room.tiebreakerActive = false;
        room.tiebreakerCandidates = [];
        this.broadcastState(roomId);
        return;
      }

      // Player lynch processed
    }

    // Check win condition
    if (this.applyImmediateWinner(roomId, room)) {
      return;
    }
    this.markWolfParityIfNeeded(room);

    if (room.wolfParityPending) {
      room.state = "DAY_START";
      room.dayStartNextAction = "night";
      room.dayVotes = {};
      room.tiebreakerActive = false;
      room.tiebreakerCandidates = [];
      this.broadcastState(roomId);
      return;
    }

    this.transitionToNight(roomId, room);
  }

  private transitionToNight(roomId: string, room: WeredogRoom) {
    // Reset day state
    room.dayVotes = {};
    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];
    this.getAlivePlayers(room).forEach((p) => (p.hasVoted = false));

    this.beginNight(roomId, room);
    this.broadcastState(roomId);
  }

  // ─── Win Condition ───

  private checkWinCondition(room: WeredogRoom): WeredogRoom["winner"] | null {
    const alive = this.getAlivePlayers(room);
    const wolves = alive.filter((p) => p.role === "Wolf");
    const nonWolves = alive.filter((p) => p.role !== "Wolf");

    // All wolves dead -> Villagers win
    if (wolves.length === 0) return "Villager";

    // Wolves at parity are a host decision, not an automatic win.
    if (wolves.length >= nonWolves.length) {
      // Check Cupid third-party win: if exactly 2 alive, both are lovers, one wolf one villager
      if (alive.length === 2 && room.cupidLoverUserIds) {
        const [id1, id2] = room.cupidLoverUserIds;
        const isLoverPair = (alive[0].userId === id1 && alive[1].userId === id2) ||
                            (alive[0].userId === id2 && alive[1].userId === id1);
        if (isLoverPair) {
          const roles = alive.map((p) => p.role);
          const hasWolf = roles.includes("Wolf");
          const hasNonWolf = roles.some((r) => r !== "Wolf");
          if (hasWolf && hasNonWolf) return "Cupid";
        }
      }
    }

    // Check Cupid third-party win at any point: if only 2 alive and they are wolf+villager lovers
    if (alive.length === 2 && room.cupidLoverUserIds) {
      const [id1, id2] = room.cupidLoverUserIds;
      const isLoverPair = (alive[0].userId === id1 && alive[1].userId === id2) ||
                          (alive[0].userId === id2 && alive[1].userId === id1);
      if (isLoverPair) {
        const roles = alive.map((p) => p.role);
        const hasWolf = roles.includes("Wolf");
        const hasNonWolf = roles.some((r) => r !== "Wolf");
        if (hasWolf && hasNonWolf) return "Cupid";
      }
    }

    return null;
  }

  private getWinMessage(winner: WeredogRoom["winner"]): string {
    switch (winner) {
      case "Villager": return "🎉 Phe dân thắng! Tất cả chó sói đã bị tiêu diệt!";
      case "Wolf": return "🐺 Phe sói thắng! Sói đã thống trị làng!";
      case "Cupid": return "💕 Phe tình nhân thắng! Tình yêu chiến thắng tất cả!";
      case "Abandoned": return "Trò chơi bị hủy.";
      default: return "Trò chơi kết thúc.";
    }
  }

  // ─── Broadcast (role-based information hiding) ───

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Calculate vote weights for all players (Elder counts as 2)
    room.players.forEach((p) => {
      p.voteWeight = p.role === "Elder" && p.isAlive ? 2 : 1;
    });

    this.io.in(roomId).fetchSockets().then((socketList) => {
      for (const s of socketList) {
        const userId = s.data.userId as string | undefined;
        const me = userId
          ? room.players.find((p) => p.userId === userId && p.id === s.id)
          : undefined;
        const view = this.buildPlayerView(room, me);
        s.emit("stateUpdate", view);
      }
    });
  }

  private buildPlayerView(room: WeredogRoom, me: WeredogPlayer | undefined): Partial<WeredogRoom> {
    const clone: WeredogRoom = structuredClone(room);
    clone.players.forEach(stripConnectionMetadata);
    const isHost = me?.isModerator;
    const isGameActive = room.state !== "LOBBY" && room.state !== "GAME_OVER";

    clone.isElderDead = this.isElderDead(room);
    
    // Slice messages from circular buffer start index
    clone.messages = room.messages.slice(room.messageStartIndex || 0);

    // Host (moderator) sees everything
    if (isHost) return clone;

    // Game Over: reveal everything
    if (room.state === "GAME_OVER") return clone;

    // Lobby/Role Reveal: only see own role
    if (room.state === "LOBBY" || room.state === "ROLE_REVEAL") {
      clone.players.forEach((p) => {
        if (!me || p.userId !== me.userId) {
          delete p.role;
        }
      });
      return clone;
    }

    // Active game: hide secrets
    if (isGameActive) {
      // Hide wolf votes from non-wolves
      if (me?.role !== "Wolf") {
        clone.wolfVotes = {};
        clone.wolfVictimUserId = undefined;
      }

      // Hide bodyguard target from non-bodyguard
      if (me?.role !== "Bodyguard") {
        clone.bodyguardTargetUserId = undefined;
      }

      // Hide seer result from non-seer
      if (me?.role !== "Seer") {
        clone.seerTargetUserId = undefined;
        clone.seerResult = undefined;
      }

      // Hide witch info from non-witch
      if (me?.role !== "Witch") {
        clone.witchActionSelected = undefined;
        clone.witchTargetUserId = undefined;
      } else {
        // Witch can see wolfVictimUserId ONLY if she chose 'save'
        if (room.witchActionSelected === "save" && room.wolfVictimUserId) {
          clone.wolfVictimUserId = room.wolfVictimUserId;
        } else {
          clone.wolfVictimUserId = undefined;
        }
      }

      // Cupid lovers masking: Cupid sees lovers from end of Cupid phase, lovers see each other after host confirmation
      const isLoversConfirmed = room.cupidLoversConfirmed === true;
      if (me?.role === "Cupid" && isLoversConfirmed) {
        // Cupid sees the lovers list and who they are
        clone.cupidLoverUserIds = room.cupidLoverUserIds;
        clone.players.forEach((p) => {
          if (room.cupidLoverUserIds?.includes(p.userId)) {
            p.isLover = true;
          } else {
            p.isLover = false;
            delete p.loverUserId;
          }
        });
      } else if (me?.isLover && isLoversConfirmed) {
        // Lovers see each other after host confirmation
        clone.cupidLoverUserIds = undefined;
        clone.players.forEach((p) => {
          if (p.userId !== me.userId && p.userId !== me.loverUserId) {
            p.isLover = false;
            delete p.loverUserId;
          }
        });
      } else {
        // Otherwise (unconfirmed, or normal player), hide all lover information
        clone.cupidLoverUserIds = undefined;
        clone.players.forEach((p) => {
          p.isLover = false;
          delete p.loverUserId;
        });
      }

      // Hide history from players (only host sees full history)
      clone.history = clone.history.map((h) => {
        const filtered: WeredogHistoryRecord = { nightNumber: h.nightNumber };

        // Seer sees own inspection history
        if (me?.role === "Seer") {
          filtered.seerTargetUserId = h.seerTargetUserId;
          filtered.seerResult = h.seerResult;
        }
        // Bodyguard sees own protection history
        if (me?.role === "Bodyguard") {
          filtered.bodyguardTargetUserId = h.bodyguardTargetUserId;
        }
        // Wolf sees bite history
        if (me?.role === "Wolf") {
          filtered.wolfVictimUserId = h.wolfVictimUserId;
        }

        return filtered;
      });

      // Obfuscate roles: no one sees others' roles during game
      clone.players.forEach((p) => {
        if (!me || p.userId === me.userId) return;

        // Wolves see each other
        if (me.role === "Wolf" && p.role === "Wolf") return;

        // Hide role from everyone else
        delete p.role;
      });

      // Hide witch bottles from non-witch
      clone.players.forEach((p) => {
        if (!me || p.userId !== me.userId) {
          p.witchHasSaveBottle = true; // ponytail: default true to hide info
          p.witchHasKillBottle = true;
        }
      });

      // Hide Elder lives from non-elder
      clone.players.forEach((p) => {
        if (!me || p.userId !== me.userId) {
          p.elderLives = 0;
        }
      });

      // Obfuscate Elder death from wolves and normal villagers
      const isFunctionRole = me && ["Seer", "Bodyguard", "Witch", "Hunter", "Cupid"].includes(me.role || "");
      if (!isFunctionRole) {
        delete clone.isElderDead;
      }
    }

    return clone;
  }
}
