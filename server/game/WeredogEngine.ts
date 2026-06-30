import { Server, Socket, Namespace } from "socket.io";
import type {
  WeredogRoom,
  WeredogPlayer,
  WeredogRole,
  WeredogGameState,
  WeredogHistoryRecord,
} from "./WeredogTypes";
import { ROLE_CONFIGS } from "./WeredogTypes";

export class WeredogEngine {
  private rooms: Map<string, WeredogRoom> = new Map();
  private io: Namespace;
  private chatRateLimits: Map<string, number[]> = new Map();
  private autoConfirmTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private emptyRoomCleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(server: Server) {
    this.io = server.of("/weredog");
    this.setupListeners();
  }

  // ─── Helpers ───

  private uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private addSystemMessage(room: WeredogRoom, text: string) {
    room.messages.push({
      senderId: "system",
      senderName: "Hệ thống",
      text,
      timestamp: Date.now(),
    });
    if (room.messages.length > 50) room.messages.shift();
  }

  private getActivePlayers(room: WeredogRoom): WeredogPlayer[] {
    return room.players.filter((p) => !p.isSpectator && !p.isHost);
  }

  private getAlivePlayers(room: WeredogRoom): WeredogPlayer[] {
    return this.getActivePlayers(room).filter((p) => p.isAlive);
  }

  private findPlayer(room: WeredogRoom, userId: string): WeredogPlayer | undefined {
    return room.players.find((p) => p.userId === userId);
  }

  private findHost(room: WeredogRoom): WeredogPlayer | undefined {
    return room.players.find((p) => p.isHost);
  }

  private clearAutoConfirmTimer(roomId: string) {
    const timer = this.autoConfirmTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.autoConfirmTimers.delete(roomId);
    }
  }

  private setAutoConfirmTimer(roomId: string, callback: () => void, delayMs = 10000) {
    this.clearAutoConfirmTimer(roomId);
    const timer = setTimeout(() => {
      this.autoConfirmTimers.delete(roomId);
      callback();
    }, delayMs);
    this.autoConfirmTimers.set(roomId, timer);
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
      this.clearAutoConfirmTimer(roomId);
      this.rooms.delete(roomId);
    }, 15000);
    this.emptyRoomCleanupTimers.set(roomId, timer);
  }

  // ─── Socket Listeners ───

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Weredog client connected:", socket.id);

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

      socket.on("joinRoom", ({ roomId, playerName, userId, avatarUrl }) => {
        if (!userId) return;
        this.joinRoom(roomId, { id: socket.id, userId, name: playerName, avatarUrl }, socket);
        socket.data.roomId = roomId;
        socket.data.userId = userId;
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
          this.startGame(socket.data.roomId, socket.data.userId);
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

      socket.on("hunterAim", (targetUserId: string) => {
        if (socket.data.roomId && socket.data.userId)
          this.hunterAim(socket.data.roomId, socket.data.userId, targetUserId);
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

      // ── Day actions ──

      socket.on("dayVote", (targetUserId: string | "skip") => {
        if (socket.data.roomId && socket.data.userId)
          this.dayVote(socket.data.roomId, socket.data.userId, targetUserId);
      });

      socket.on("hostConfirmDayVote", () => {
        if (socket.data.roomId && socket.data.userId)
          this.hostConfirmDayVote(socket.data.roomId, socket.data.userId);
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
      settings: {
        wolfCount: 2,
        enabledRoles: [],
        discussionTimeSeconds: 180,
      },
      messages: [],
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
    pData: { id: string; userId: string; name: string; avatarUrl?: string },
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
      existing.id = pData.id;
      existing.name = pData.name;
      if (pData.avatarUrl !== undefined) existing.avatarUrl = pData.avatarUrl;
      existing.status = "connected";
    } else {
      const isHost = room.players.length === 0;
      const isMidGame = room.state !== "LOBBY";
      room.players.push({
        id: pData.id,
        userId: pData.userId,
        name: pData.name,
        avatarUrl: pData.avatarUrl,
        isHost: isHost && !isMidGame,
        isSpectator: isMidGame,
        isReady: false,
        status: "connected",
        isAlive: true,
        witchHasSaveBottle: true,
        witchHasKillBottle: true,
        elderLives: 2,
        isLover: false,
      });
    }

    socket.join(roomId);
    this.broadcastState(roomId);
  }

  private leaveRoom(roomId: string, socketId: string) {
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
        const newHost = room.players.find((p) => p.status === "connected" && !p.isSpectator) ?? room.players[0];
        newHost.isHost = true;
      }
    }

    // If wolf disconnected mid-vote, check if remaining wolves all voted
    if (room.state === "NIGHT_ACTION" && room.currentNightActiveRole === "Wolf" && player.role === "Wolf") {
      this.checkWolfVoteComplete(roomId, room);
    }

    this.broadcastState(roomId);
  }

  // ─── Chat ───

  private chatMessage(roomId: string, userId: string, text: string) {
    if (!text || text.length > 500) return;
    const now = Date.now();
    let userStamps = this.chatRateLimits.get(userId) || [];
    userStamps = userStamps.filter((t) => now - t < 10000);
    if (userStamps.length >= 10) return;
    userStamps.push(now);
    this.chatRateLimits.set(userId, userStamps);

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
    if (room.messages.length > 50) room.messages.shift();
    this.broadcastState(roomId);
  }

  // ─── Settings ───

  private updateSettings(roomId: string, userId: string, settings: Partial<WeredogRoom["settings"]>) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    if (settings.wolfCount !== undefined) {
      settings.wolfCount = Math.max(1, Math.min(10, settings.wolfCount));
    }
    if (settings.discussionTimeSeconds !== undefined) {
      settings.discussionTimeSeconds = Math.max(60, Math.min(600, settings.discussionTimeSeconds));
    }
    if (settings.enabledRoles !== undefined) {
      const validRoles: WeredogRole[] = ["Bodyguard", "Seer", "Hunter", "Cupid", "Witch", "Elder"];
      settings.enabledRoles = settings.enabledRoles.filter((r) => validRoles.includes(r));
    }

    room.settings = { ...room.settings, ...settings };
    this.broadcastState(roomId);
  }

  // ─── Lobby Actions ───

  private toggleSpectatorLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.isHost) return;
    player.isSpectator = !player.isSpectator;
    this.broadcastState(roomId);
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
    if (!target || target.userId === userId) return;

    player.isHost = false;
    player.isSpectator = false;
    target.isHost = true;
    target.isSpectator = false;
    this.broadcastState(roomId);
  }

  private playerReady(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "ROLE_REVEAL") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.isHost || player.isSpectator) return;

    player.isReady = true;

    const activePlayers = this.getActivePlayers(room);
    if (activePlayers.every((p) => p.isReady || p.status === "disconnected")) {
      this.beginNight(roomId, room);
    }
    this.broadcastState(roomId);
  }

  private returnToLobby(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    this.clearAutoConfirmTimer(roomId);
    room.state = "LOBBY";
    room.nightNumber = 0;
    room.wolfVotes = {};
    room.wolfVictimUserId = undefined;
    room.bodyguardTargetUserId = undefined;
    room.seerTargetUserId = undefined;
    room.seerResult = undefined;
    room.witchActionSelected = undefined;
    room.witchTargetUserId = undefined;
    room.hunterTargetUserId = undefined;
    room.cupidLoverUserIds = undefined;
    room.deathsThisNight = [];
    room.dayVotes = {};
    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];
    room.activeNightRolesOrder = [];
    room.currentNightRoleIndex = -1;
    room.currentNightActiveRole = undefined;
    room.history = [];
    room.winner = undefined;

    room.players = room.players.filter((p) => p.status === "connected");
    room.players.forEach((p) => {
      delete p.role;
      p.isReady = false;
      p.isAlive = true;
      p.isLover = false;
      p.loverUserId = undefined;
      p.protectedLastNightUserId = undefined;
      p.hunterTargetUserId = undefined;
      p.witchHasSaveBottle = true;
      p.witchHasKillBottle = true;
      p.elderLives = 2;
      p.hasVoted = false;
      if (!p.isHost) p.isSpectator = false;
    });

    this.addSystemMessage(room, "Trở về phòng chờ.");
    this.broadcastState(roomId);
  }

  // ─── Game Start & Role Assignment ───

  private startGame(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "LOBBY") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    const activePlayers = this.getActivePlayers(room);
    const totalPlayers = activePlayers.length;
    if (totalPlayers < 4) return;
    if (room.settings.wolfCount >= totalPlayers) return;

    // Assign roles
    const roles: WeredogRole[] = [];
    for (let i = 0; i < room.settings.wolfCount; i++) roles.push("Wolf");
    for (const r of room.settings.enabledRoles) roles.push(r);
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
      p.hunterTargetUserId = undefined;
      p.witchHasSaveBottle = true;
      p.witchHasKillBottle = true;
      p.elderLives = p.role === "Elder" ? 2 : 0;
      p.hasVoted = false;
    });

    room.state = "ROLE_REVEAL";
    room.nightNumber = 0;
    room.history = [];
    room.winner = undefined;
    room.cupidLoverUserIds = undefined;

    this.addSystemMessage(room, "Trò chơi bắt đầu! Hãy xem vai trò của bạn.");
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
    room.deathsThisNight = [];

    // Determine night action order based on alive roles with nightPriority
    const isElderDead = this.isElderDead(room);
    const aliveRoles = new Set(this.getAlivePlayers(room).map((p) => p.role!));
    const nightRoles: WeredogRole[] = [];

    // Cupid only on night 1
    if (room.nightNumber === 1 && aliveRoles.has("Cupid") && !isElderDead) {
      nightRoles.push("Cupid");
    }
    if (aliveRoles.has("Bodyguard") && !isElderDead) nightRoles.push("Bodyguard");
    if (aliveRoles.has("Wolf")) nightRoles.push("Wolf");
    if (aliveRoles.has("Seer") && !isElderDead) nightRoles.push("Seer");
    if (aliveRoles.has("Witch") && !isElderDead) nightRoles.push("Witch");
    if (aliveRoles.has("Hunter") && !isElderDead) nightRoles.push("Hunter");

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

    this.addSystemMessage(room, `🌙 Đêm ${room.nightNumber} bắt đầu. Mọi người nhắm mắt ngủ.`);
    this.broadcastState(roomId);
  }

  private advanceNightRole(roomId: string, room: WeredogRoom) {
    this.clearAutoConfirmTimer(roomId);
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

  private wolfVote(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Wolf") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Wolf" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!target || !target.isAlive || target.role === "Wolf") return;

    room.wolfVotes[userId] = targetUserId;
    this.broadcastState(roomId);

    this.checkWolfVoteComplete(roomId, room);
  }

  private checkWolfVoteComplete(roomId: string, room: WeredogRoom) {
    const aliveWolves = this.getAlivePlayers(room).filter((p) => p.role === "Wolf" && p.status === "connected");
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

    // Start auto-confirm timer for host
    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Wolf") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });

    this.broadcastState(roomId);
  }

  private wolfRevote(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Wolf") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Wolf" || !player.isAlive) return;

    // Only allow revote if auto-confirm timer is still running (host hasn't confirmed yet)
    if (!this.autoConfirmTimers.has(roomId)) return;

    this.clearAutoConfirmTimer(roomId);
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
    if (!target || !target.isAlive) return;

    // Cannot protect same person two nights in a row
    if (player.protectedLastNightUserId === targetUserId) return;

    room.bodyguardTargetUserId = targetUserId;

    // Auto-advance with 10s host confirm
    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Bodyguard") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });
    this.broadcastState(roomId);
  }

  // ── Seer ──

  private seerInspect(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Seer") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Seer" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!target || !target.isAlive || target.userId === userId) return;

    room.seerTargetUserId = targetUserId;
    room.seerResult = target.role === "Wolf" ? "Wolf" : "Human";

    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Seer") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });
    this.broadcastState(roomId);
  }

  // ── Hunter ──

  private hunterAim(roomId: string, userId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION" || room.currentNightActiveRole !== "Hunter") return;
    const player = this.findPlayer(room, userId);
    if (!player || player.role !== "Hunter" || !player.isAlive) return;
    const target = this.findPlayer(room, targetUserId);
    if (!target || !target.isAlive || target.userId === userId) return;

    player.hunterTargetUserId = targetUserId;
    room.hunterTargetUserId = targetUserId;

    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Hunter") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });
    this.broadcastState(roomId);
  }

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
    if (!p1 || !p2 || !p1.isAlive || !p2.isAlive) return;

    room.cupidLoverUserIds = [userId1, userId2];
    p1.isLover = true;
    p1.loverUserId = userId2;
    p2.isLover = true;
    p2.loverUserId = userId1;

    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Cupid") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });
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
        // Auto-advance: skip turn silently
        this.setAutoConfirmTimer(roomId, () => {
          const r = this.rooms.get(roomId);
          if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Witch") {
            this.advanceNightRole(roomId, r);
            this.broadcastState(roomId);
          }
        });
      }
      // If someone was bitten, client will show who — witch then calls witchUsePotion
    }

    if (action === "none") {
      // Skip turn
      this.setAutoConfirmTimer(roomId, () => {
        const r = this.rooms.get(roomId);
        if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Witch") {
          this.advanceNightRole(roomId, r);
          this.broadcastState(roomId);
        }
      });
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
      room.witchTargetUserId = room.wolfVictimUserId ?? undefined;
      player.witchHasSaveBottle = false;
    } else if (room.witchActionSelected === "kill" && targetUserId) {
      const target = this.findPlayer(room, targetUserId);
      if (!target || !target.isAlive || target.userId === userId) return;
      room.witchTargetUserId = targetUserId;
      player.witchHasKillBottle = false;
    } else {
      return;
    }

    this.setAutoConfirmTimer(roomId, () => {
      const r = this.rooms.get(roomId);
      if (r && r.state === "NIGHT_ACTION" && r.currentNightActiveRole === "Witch") {
        this.advanceNightRole(roomId, r);
        this.broadcastState(roomId);
      }
    });
    this.broadcastState(roomId);
  }

  // ── Host Confirm Night Action ──

  private hostConfirmNightAction(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "NIGHT_ACTION") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    this.advanceNightRole(roomId, room);
    this.broadcastState(roomId);
  }

  // ─── Morning Resolution ───

  private resolveMorning(roomId: string, room: WeredogRoom) {
    this.clearAutoConfirmTimer(roomId);
    const deaths: string[] = [];

    // 1. Wolf bite
    let wolfVictim = room.wolfVictimUserId ?? null;

    // Check bodyguard protection
    if (wolfVictim && room.bodyguardTargetUserId === wolfVictim) {
      wolfVictim = null; // Protected
    }

    // Check witch save
    if (wolfVictim && room.witchActionSelected === "save" && room.witchTargetUserId === wolfVictim) {
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

    // 2. Witch kill
    if (room.witchActionSelected === "kill" && room.witchTargetUserId) {
      const witchTarget = this.findPlayer(room, room.witchTargetUserId);
      if (witchTarget && witchTarget.isAlive && !deaths.includes(witchTarget.userId)) {
        this.killPlayer(room, witchTarget, deaths);
      }
    }

    // 3. Hunter trigger: if hunter died this morning, shoot target
    const hunter = this.getActivePlayers(room).find((p) => p.role === "Hunter");
    if (hunter && deaths.includes(hunter.userId) && hunter.hunterTargetUserId) {
      const hunterTarget = this.findPlayer(room, hunter.hunterTargetUserId);
      if (hunterTarget && hunterTarget.isAlive && !deaths.includes(hunterTarget.userId)) {
        this.killPlayer(room, hunterTarget, deaths);
      }
    }

    // 4. Cupid heartbreak: if one lover died, the other dies too
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
      hunterTargetUserId: room.hunterTargetUserId,
    };
    if (room.nightNumber === 1 && room.cupidLoverUserIds) {
      record.cupidLovers = [...room.cupidLoverUserIds];
    }
    room.history.push(record);

    room.deathsThisNight = deaths;

    // Check win conditions
    const winner = this.checkWinCondition(room);
    if (winner) {
      room.winner = winner;
      room.state = "GAME_OVER";
      this.addSystemMessage(room, this.getWinMessage(winner));
      this.broadcastState(roomId);
      return;
    }

    // Transition to day
    room.state = "DAY_START";
    room.dayVotes = {};
    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];

    const deathCount = deaths.length;
    if (deathCount === 0) {
      this.addSystemMessage(room, "☀️ Trời sáng. Đêm qua bình yên, không ai chết.");
    } else {
      const deadNames = deaths.map((id) => this.findPlayer(room, id)?.name ?? "???").join(", ");
      this.addSystemMessage(room, `☀️ Trời sáng. Đêm qua có ${deathCount} người chết: ${deadNames}.`);
    }

    this.broadcastState(roomId);
  }

  private killPlayer(room: WeredogRoom, player: WeredogPlayer, deaths: string[]) {
    player.isAlive = false;
    deaths.push(player.userId);

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
      // Check if hunter was heartbroken
      if (p2.role === "Hunter" && p2.hunterTargetUserId) {
        const ht = this.findPlayer(room, p2.hunterTargetUserId);
        if (ht && ht.isAlive && !deaths.includes(ht.userId)) {
          this.killPlayer(room, ht, deaths);
        }
      }
    } else if (deaths.includes(id2) && p1.isAlive && !deaths.includes(id1)) {
      this.killPlayer(room, p1, deaths);
      if (p1.role === "Hunter" && p1.hunterTargetUserId) {
        const ht = this.findPlayer(room, p1.hunterTargetUserId);
        if (ht && ht.isAlive && !deaths.includes(ht.userId)) {
          this.killPlayer(room, ht, deaths);
        }
      }
    }
  }

  private isElderDead(room: WeredogRoom): boolean {
    const elder = this.getActivePlayers(room).find((p) => p.role === "Elder");
    return elder ? !elder.isAlive : false;
  }

  // ─── Day Voting ───

  private dayVote(roomId: string, userId: string, targetUserId: string | "skip") {
    const room = this.rooms.get(roomId);
    if (!room || (room.state !== "DAY_START" && room.state !== "DAY_VOTING")) return;
    const player = this.findPlayer(room, userId);
    if (!player || !player.isAlive || player.isHost) return;

    room.state = "DAY_VOTING";
    room.dayVotes[userId] = targetUserId;
    player.hasVoted = true;

    // Check if all alive non-host players voted
    const aliveVoters = this.getAlivePlayers(room);
    const allVoted = aliveVoters.every((p) => room.dayVotes[p.userId] !== undefined || p.status === "disconnected");

    if (allVoted) {
      this.setAutoConfirmTimer(roomId, () => {
        const r = this.rooms.get(roomId);
        if (r && r.state === "DAY_VOTING") {
          this.resolveDayVote(roomId, r);
        }
      });
    }

    this.broadcastState(roomId);
  }

  private hostConfirmDayVote(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "DAY_VOTING") return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    this.clearAutoConfirmTimer(roomId);
    this.resolveDayVote(roomId, room);
  }

  private resolveDayVote(roomId: string, room: WeredogRoom) {
    this.clearAutoConfirmTimer(roomId);

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
      this.addSystemMessage(room, "Kết quả vote: Skip. Không ai bị treo cổ.");
      this.transitionToNight(roomId, room);
      return;
    }

    if (topCandidates.length === 1) {
      // Clear winner
      const victimId = topCandidates[0][0];
      if (victimId === "skip") {
        this.addSystemMessage(room, "Kết quả vote: Skip. Không ai bị treo cổ.");
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
      this.addSystemMessage(room, "Kết quả vote: Skip. Không ai bị treo cổ.");
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
    const names = room.tiebreakerCandidates.map((id) => this.findPlayer(room, id)?.name ?? "???").join(", ");
    this.addSystemMessage(room, `Hòa phiếu giữa: ${names}. Quản trò quyết định vote lại hoặc skip.`);
    this.broadcastState(roomId);
  }

  private hostTiebreakerDecision(roomId: string, userId: string, decision: "revote" | "skip") {
    const room = this.rooms.get(roomId);
    if (!room || !room.tiebreakerActive) return;
    const player = this.findPlayer(room, userId);
    if (!player?.isHost) return;

    room.tiebreakerActive = false;
    room.tiebreakerCandidates = [];

    if (decision === "skip") {
      this.addSystemMessage(room, "Quản trò quyết định: Skip. Không ai bị treo cổ.");
      this.transitionToNight(roomId, room);
    } else {
      // Revote: reset day votes
      room.dayVotes = {};
      room.state = "DAY_VOTING";
      this.getAlivePlayers(room).forEach((p) => (p.hasVoted = false));
      this.addSystemMessage(room, "Quản trò quyết định: Vote lại!");
      this.broadcastState(roomId);
    }
  }

  private executeHanging(roomId: string, room: WeredogRoom, victimId: string) {
    const deaths: string[] = [];
    const victim = this.findPlayer(room, victimId);
    if (victim && victim.isAlive) {
      this.killPlayer(room, victim, deaths);

      // Hunter trigger on hanging
      if (victim.role === "Hunter" && victim.hunterTargetUserId && !this.isElderDead(room)) {
        const hunterTarget = this.findPlayer(room, victim.hunterTargetUserId);
        if (hunterTarget && hunterTarget.isAlive && !deaths.includes(hunterTarget.userId)) {
          this.killPlayer(room, hunterTarget, deaths);
        }
      }

      // Cupid heartbreak
      this.resolveHeartbreak(room, deaths);

      const victimName = victim.name;
      this.addSystemMessage(room, `Kết quả vote: ${victimName} bị treo cổ.`);
      if (deaths.length > 1) {
        const extraDeaths = deaths.slice(1).map((id) => this.findPlayer(room, id)?.name ?? "???").join(", ");
        this.addSystemMessage(room, `${extraDeaths} cũng chết theo.`);
      }
    }

    // Check win condition
    const winner = this.checkWinCondition(room);
    if (winner) {
      room.winner = winner;
      room.state = "GAME_OVER";
      this.addSystemMessage(room, this.getWinMessage(winner));
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

    // Wolves >= non-wolves -> Wolf wins
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
      return "Wolf";
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

    this.io.in(roomId).fetchSockets().then((socketList) => {
      for (const s of socketList) {
        const userId = s.data.userId as string | undefined;
        const me = userId ? room.players.find((p) => p.userId === userId) : undefined;
        const view = this.buildPlayerView(room, me);
        s.emit("stateUpdate", view);
      }
    });
  }

  private buildPlayerView(room: WeredogRoom, me: WeredogPlayer | undefined): Partial<WeredogRoom> {
    const clone: WeredogRoom = JSON.parse(JSON.stringify(room));
    const isHost = me?.isHost;
    const isGameActive = room.state !== "LOBBY" && room.state !== "GAME_OVER";

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

      // Hide hunter target from non-hunter
      if (me?.role !== "Hunter") {
        clone.hunterTargetUserId = undefined;
        clone.players.forEach((p) => { delete p.hunterTargetUserId; });
      }

      // Cupid lovers: only the lovers themselves know they are lovers
      if (me && !me.isLover) {
        clone.cupidLoverUserIds = undefined;
        clone.players.forEach((p) => {
          p.isLover = false;
          delete p.loverUserId;
        });
      } else if (me?.isLover) {
        // Lover sees who their partner is, but not other's role
        clone.players.forEach((p) => {
          if (p.userId !== me.userId && p.userId !== me.loverUserId) {
            p.isLover = false;
            delete p.loverUserId;
          }
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
    }

    return clone;
  }
}
