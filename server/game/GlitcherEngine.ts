import { randomUUID } from "node:crypto";
import type { Namespace, Server, Socket } from "socket.io";
import {
  createGlitcherSceneDeck,
  getGlitcherDiscussionSeconds,
  getGlitcherScene,
  GLITCHER_SETTINGS,
  scoreGlitcher,
  shuffleGlitcherItems,
} from "./GlitcherData";
import { GLITCHER_NAMESPACE } from "./GlitcherTypes";
import type {
  GlitcherActionAck,
  GlitcherActionPayload,
  GlitcherAssignment,
  GlitcherClientState,
  GlitcherGameState,
  GlitcherJoinRoomPayload,
  GlitcherPlayer,
  GlitcherPrivateCard,
  GlitcherPublicPlayer,
  GlitcherQuestionRound,
  GlitcherRoom,
  GlitcherSceneReveal,
  GlitcherScoreDelta,
  GlitcherSelectQuestionPayload,
  GlitcherSubmitVotePayload,
  GlitcherTourSummary,
  GlitcherTransferHostPayload,
} from "./GlitcherTypes";

type ActionAckCallback = (ack: GlitcherActionAck) => void;
type BooleanAckCallback = (result: boolean) => void;
type RoomAction = (
  room: GlitcherRoom,
  player: GlitcherPlayer,
) => GlitcherActionAck;

const ROOM_CODE_PATTERN = /^\d{6}$/;
const MAX_PLAYER_NAME_LENGTH = 24;
const MAX_USER_ID_LENGTH = 160;
const MAX_ACTION_ID_LENGTH = 160;
const MAX_PROCESSED_ACTIONS_PER_ROOM = 2_048;
const EMPTY_ROOM_CLEANUP_MS = 5 * 60 * 1_000;
const QUESTION_RECONNECT_GRACE_MS = 30 * 1_000;

const ACTIVE_SCENE_STATES = new Set<GlitcherGameState>([
  "ROLE_REVEAL",
  "QUESTION_ROUND",
  "PERFORMANCE_SETUP",
  "PERFORMANCE",
  "DISCUSSION",
  "VOTING",
]);

function ok(code?: string): GlitcherActionAck {
  return code ? { ok: true, code } : { ok: true };
}

function fail(code: string, message: string): GlitcherActionAck {
  return { ok: false, code, message };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);
  return name.length > 0 ? name : null;
}

function normalizeUserId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const userId = value.trim();
  if (userId.length === 0 || userId.length > MAX_USER_ID_LENGTH) return null;
  return userId;
}

function normalizeActionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const actionId = value.trim();
  if (actionId.length === 0 || actionId.length > MAX_ACTION_ID_LENGTH) return null;
  return actionId;
}

function getPublicQuestionId(index: number): string {
  return `q-${String(index + 1).padStart(2, "0")}`;
}

export interface GlitcherEngineOptions {
  /** Test override; production defaults to the authored 30-second grace. */
  questionReconnectGraceMs?: number;
}

export class GlitcherEngine {
  private readonly io: Namespace;
  private readonly questionReconnectGraceMs: number;
  private readonly rooms = new Map<string, GlitcherRoom>();
  private readonly phaseTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly emptyRoomCleanupTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly questionReconnectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(server: Server, options: GlitcherEngineOptions = {}) {
    this.io = server.of(GLITCHER_NAMESPACE);
    this.questionReconnectGraceMs = Math.max(
      1,
      options.questionReconnectGraceMs ?? QUESTION_RECONNECT_GRACE_MS,
    );
    this.setupListeners();
  }

  /** Clears in-memory timers/rooms; primarily used by isolated integration tests. */
  public dispose() {
    this.phaseTimers.forEach((timer) => clearTimeout(timer));
    this.emptyRoomCleanupTimers.forEach((timer) => clearTimeout(timer));
    this.questionReconnectTimers.forEach((timer) => clearTimeout(timer));
    this.phaseTimers.clear();
    this.emptyRoomCleanupTimers.clear();
    this.questionReconnectTimers.clear();
    this.rooms.clear();
  }

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      socket.on(
        "checkRoom",
        (roomId: string, callback: BooleanAckCallback) => {
          if (typeof callback !== "function") return;
          callback(
            typeof roomId === "string" &&
              ROOM_CODE_PATTERN.test(roomId) &&
              this.rooms.has(roomId),
          );
        },
      );

      socket.on(
        "createRoom",
        (roomId: string, callback: BooleanAckCallback) => {
          if (typeof callback !== "function") return;
          if (
            typeof roomId !== "string" ||
            !ROOM_CODE_PATTERN.test(roomId) ||
            this.rooms.has(roomId)
          ) {
            callback(false);
            return;
          }

          this.createRoom(roomId);
          callback(true);
        },
      );

      socket.on("joinRoom", (payload: GlitcherJoinRoomPayload) => {
        void this.joinRoom(socket, payload);
      });

      socket.on(
        "toggleReady",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.toggleReady(room, player),
          );
        },
      );

      socket.on(
        "startTour",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.startTour(room, player),
          );
        },
      );

      socket.on(
        "confirmRole",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.confirmRole(room, player),
          );
        },
      );

      socket.on(
        "selectQuestion",
        (
          payload: GlitcherSelectQuestionPayload,
          callback?: ActionAckCallback,
        ) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.selectQuestion(room, player, payload.questionId),
          );
        },
      );

      socket.on(
        "completeQuestion",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.completeQuestion(room, player),
          );
        },
      );

      socket.on(
        "submitVote",
        (payload: GlitcherSubmitVotePayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.submitVote(room, player, payload.targetUserId),
          );
        },
      );

      socket.on(
        "nextScene",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.nextScene(room, player),
          );
        },
      );

      socket.on(
        "restartTour",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.restartTour(room, player),
          );
        },
      );

      socket.on(
        "returnToLobby",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.returnToLobby(room, player),
          );
        },
      );

      socket.on(
        "explicitLeave",
        (payload: GlitcherActionPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.explicitLeave(room, player, socket),
          );
        },
      );

      socket.on(
        "transferHost",
        (payload: GlitcherTransferHostPayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.transferHost(room, player, payload.targetUserId),
          );
        },
      );

      socket.on("changeName", (newName: string) => {
        const room = this.getSocketRoom(socket);
        const userId = socket.data.userId as string | undefined;
        const player = userId
          ? room?.players.find((candidate) => candidate.userId === userId)
          : undefined;
        const normalizedName = normalizeName(newName);
        if (!room || !player || !normalizedName || room.state !== "LOBBY") return;
        player.name = normalizedName;
        this.broadcastState(room.id);
      });

      socket.on(
        "measurePing",
        (timestamp: number, callback: (value: number) => void) => {
          if (typeof callback === "function") callback(timestamp);
        },
      );

      socket.on("updatePing", (userId: string, ping: number) => {
        const roomId = socket.data.roomId as string | undefined;
        if (
          !roomId ||
          typeof userId !== "string" ||
          typeof ping !== "number" ||
          !Number.isFinite(ping)
        ) {
          return;
        }
        socket.to(roomId).emit("playerPing", userId, Math.max(0, ping));
      });

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private createRoom(roomId: string): GlitcherRoom {
    const now = Date.now();
    const room: GlitcherRoom = {
      id: roomId,
      players: [],
      state: "LOBBY",
      settings: { ...GLITCHER_SETTINGS },
      tourNumber: 0,
      sceneNumber: 0,
      seatOrderUserIds: [],
      questionCursor: 0,
      sceneDeckIds: [],
      usedSceneIds: [],
      phaseId: randomUUID(),
      phaseStartedAt: now,
      phaseDeadlineAt: null,
      questionRound: null,
      votes: {},
      sceneResults: [],
      latestReveal: null,
      tourSummary: null,
      processedActionIds: new Map(),
    };
    this.rooms.set(roomId, room);
    this.scheduleEmptyRoomCleanup(roomId);
    return room;
  }

  private async joinRoom(
    socket: Socket,
    payload: GlitcherJoinRoomPayload,
  ): Promise<void> {
    if (!isObject(payload)) {
      socket.emit("glitcherError", "Dữ liệu vào phòng không hợp lệ.");
      return;
    }

    const roomId =
      typeof payload.roomId === "string" ? payload.roomId.trim() : "";
    const userId = normalizeUserId(payload.userId);
    const playerName = normalizeName(payload.playerName);
    const reconnectToken =
      typeof payload.reconnectToken === "string"
        ? payload.reconnectToken.trim()
        : "";
    const avatarUrl =
      typeof payload.avatarUrl === "string" && payload.avatarUrl.trim()
        ? payload.avatarUrl.trim().slice(0, 2_048)
        : undefined;

    if (!ROOM_CODE_PATTERN.test(roomId) || !userId || !playerName) {
      socket.emit("glitcherError", "Mã phòng hoặc hồ sơ người chơi không hợp lệ.");
      return;
    }

    const assignedRoomId = socket.data.roomId as string | undefined;
    const assignedUserId = socket.data.userId as string | undefined;
    if (assignedRoomId && assignedRoomId !== roomId) {
      socket.emit(
        "glitcherError",
        "Socket này đã thuộc một phòng khác. Hãy rời phòng hiện tại trước.",
      );
      return;
    }
    if (assignedUserId && assignedUserId !== userId) {
      socket.emit(
        "glitcherError",
        "Socket này đã được gắn với một ghế khác.",
      );
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit("glitcherError", "Phòng không tồn tại hoặc đã bị giải tán.");
      return;
    }

    const existing = room.players.find((player) => player.userId === userId);

    if (existing) {
      const isCurrentSocket = existing.id === socket.id;
      if (!isCurrentSocket && reconnectToken !== existing.reconnectToken) {
        socket.emit(
          "glitcherError",
          "Không thể khôi phục ghế: reconnect token không hợp lệ.",
        );
        return;
      }

      if (!isCurrentSocket) {
        const previousSocket = this.io.sockets.get(existing.id);
        existing.reconnectToken = randomUUID();
        if (previousSocket && previousSocket.id !== socket.id) {
          await previousSocket.leave(roomId);
          if (previousSocket.data.roomId === roomId) {
            delete previousSocket.data.roomId;
            delete previousSocket.data.userId;
          }
          previousSocket.emit(
            "glitcherError",
            "Ghế này vừa được khôi phục trên một kết nối khác.",
          );
        }
      }

      existing.id = socket.id;
      existing.name = playerName;
      if (payload.avatarUrl !== undefined) existing.avatarUrl = avatarUrl;
      existing.status = "connected";
    } else {
      if (room.state !== "LOBBY") {
        socket.emit(
          "glitcherError",
          "Tour đã bắt đầu. Chỉ người có ghế trong phòng mới có thể kết nối lại.",
        );
        return;
      }
      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit("glitcherError", "Phòng đã đủ 12 người.");
        return;
      }

      room.players.push({
        id: socket.id,
        userId,
        reconnectToken: randomUUID(),
        name: playerName,
        avatarUrl,
        seatIndex: room.players.length,
        isHost: room.players.length === 0,
        status: "connected",
        isReady: false,
        hasConfirmedRole: false,
        hasVoted: false,
        totalScore: 0,
        sceneScore: 0,
      });
    }

    socket.data.roomId = roomId;
    socket.data.userId = userId;
    await socket.join(roomId);
    this.clearEmptyRoomCleanup(roomId);
    const joinedPlayer = room.players.find((player) => player.userId === userId);
    if (joinedPlayer) this.resumeQuestionAfterReconnect(room, joinedPlayer);
    this.reindexPlayers(room);
    this.broadcastState(roomId);
  }

  private runRoomAction(
    socket: Socket,
    payload: GlitcherActionPayload,
    callback: ActionAckCallback | undefined,
    action: RoomAction,
  ) {
    const actionId = isObject(payload)
      ? normalizeActionId(payload.actionId)
      : null;
    const room = this.getSocketRoom(socket);
    const userId = socket.data.userId as string | undefined;
    const player = userId
      ? room?.players.find((candidate) => candidate.userId === userId)
      : undefined;

    if (!actionId) {
      this.respondToAction(
        socket,
        callback,
        fail("INVALID_ACTION_ID", "actionId không hợp lệ."),
      );
      return;
    }
    if (!room || !player || player.id !== socket.id) {
      this.respondToAction(
        socket,
        callback,
        fail("NOT_IN_ROOM", "Bạn không còn ở trong phòng này."),
      );
      return;
    }

    const actionKey = `${player.userId}:${actionId}`;
    const cached = room.processedActionIds.get(actionKey);
    if (cached) {
      this.respondToAction(socket, callback, cached.ack);
      return;
    }

    const result = action(room, player);
    room.processedActionIds.set(actionKey, {
      processedAt: Date.now(),
      ack: result,
    });
    while (room.processedActionIds.size > MAX_PROCESSED_ACTIONS_PER_ROOM) {
      const oldestKey = room.processedActionIds.keys().next().value as
        | string
        | undefined;
      if (!oldestKey) break;
      room.processedActionIds.delete(oldestKey);
    }

    this.respondToAction(socket, callback, result);
  }

  private respondToAction(
    socket: Socket,
    callback: ActionAckCallback | undefined,
    result: GlitcherActionAck,
  ) {
    if (typeof callback === "function") callback(result);
    if (!result.ok && result.message) {
      socket.emit("glitcherError", result.message);
    }
  }

  private getSocketRoom(socket: Socket): GlitcherRoom | undefined {
    const roomId = socket.data.roomId as string | undefined;
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  private toggleReady(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "LOBBY") {
      return fail("INVALID_PHASE", "Chỉ có thể đổi trạng thái sẵn sàng ở lobby.");
    }
    player.isReady = !player.isReady;
    this.broadcastState(room.id);
    return ok();
  }

  private startTour(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "LOBBY") {
      return fail("INVALID_PHASE", "Tour chỉ có thể bắt đầu từ lobby.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể bắt đầu tour.");
    }
    return this.prepareTour(room, true);
  }

  private restartTour(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "TOUR_SUMMARY") {
      return fail("INVALID_PHASE", "Chỉ có thể chơi tour mới từ bảng tổng kết.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể bắt đầu tour mới.");
    }
    return this.prepareTour(room, false);
  }

  private prepareTour(
    room: GlitcherRoom,
    requireReady: boolean,
  ): GlitcherActionAck {
    const connectedPlayers = room.players.filter(
      (player) => player.status === "connected",
    );
    if (
      connectedPlayers.length < room.settings.minPlayers ||
      connectedPlayers.length > room.settings.maxPlayers
    ) {
      return fail(
        "INVALID_PLAYER_COUNT",
        `Cần từ ${room.settings.minPlayers} đến ${room.settings.maxPlayers} người để bắt đầu.`,
      );
    }
    if (
      requireReady &&
      connectedPlayers.some((candidate) => !candidate.isReady)
    ) {
      return fail(
        "PLAYERS_NOT_READY",
        "Tất cả người chơi phải sẵn sàng trước khi bắt đầu tour.",
      );
    }

    this.clearPhaseTimer(room.id);
    room.players = connectedPlayers;
    this.ensureHost(room);
    this.reindexPlayers(room);
    room.tourNumber += 1;
    room.sceneNumber = 0;
    room.seatOrderUserIds = room.players.map((player) => player.userId);
    room.questionCursor =
      room.questionCursor % Math.max(1, room.seatOrderUserIds.length);
    room.sceneDeckIds = createGlitcherSceneDeck();
    room.usedSceneIds = [];
    room.questionRound = null;
    room.votes = {};
    room.sceneResults = [];
    room.latestReveal = null;
    room.tourSummary = null;
    room.currentScene = undefined;
    room.glitchUserId = undefined;

    room.players.forEach((tourPlayer) => {
      tourPlayer.isReady = false;
      tourPlayer.hasConfirmedRole = false;
      tourPlayer.hasVoted = false;
      tourPlayer.totalScore = 0;
      tourPlayer.sceneScore = 0;
      delete tourPlayer.assignment;
    });

    const result = this.beginScene(room, true);
    if (!result.ok) return result;
    return ok();
  }

  private beginScene(
    room: GlitcherRoom,
    incrementSceneNumber: boolean,
  ): GlitcherActionAck {
    if (
      room.players.length < room.settings.minPlayers ||
      room.players.length > room.settings.maxPlayers
    ) {
      this.resetToLobby(room);
      return fail(
        "INVALID_PLAYER_COUNT",
        "Không còn đủ người. Phòng đã trở về lobby.",
      );
    }

    const sceneId = room.sceneDeckIds.shift();
    const scene = sceneId ? getGlitcherScene(sceneId) : undefined;
    if (!scene) {
      this.resetToLobby(room);
      return fail(
        "SCENE_DECK_EXHAUSTED",
        "Không còn scene mới chưa sử dụng. Phòng đã trở về lobby.",
      );
    }

    if (incrementSceneNumber) room.sceneNumber += 1;
    room.usedSceneIds.push(scene.id);
    room.currentScene = scene;
    room.latestReveal = null;
    room.tourSummary = null;
    room.questionRound = null;
    room.votes = {};

    const playerCount = room.players.length;
    const trueRoles = scene.roles.slice(0, playerCount - 1);
    const glitchRole =
      scene.glitch_scene.roles[
        Math.floor(Math.random() * scene.glitch_scene.roles.length)
      ];
    if (!trueRoles.some((role) => role.id === glitchRole.shadow_role_id)) {
      this.resetToLobby(room);
      return fail(
        "INVALID_SCENE_DATA",
        "Scene có vai mồi không tương thích với số người chơi.",
      );
    }

    const glitchPlayer =
      room.players[Math.floor(Math.random() * room.players.length)];
    const shuffledTrueRoles = shuffleGlitcherItems(trueRoles);
    let roleIndex = 0;
    room.players.forEach((scenePlayer) => {
      const isGlitch = scenePlayer.userId === glitchPlayer.userId;
      const assignment: GlitcherAssignment = {
        sceneId: scene.id,
        role: isGlitch ? glitchRole : shuffledTrueRoles[roleIndex++],
        isGlitch,
      };
      scenePlayer.assignment = assignment;
      scenePlayer.hasConfirmedRole = false;
      scenePlayer.hasVoted = false;
      scenePlayer.sceneScore = 0;
    });
    room.glitchUserId = glitchPlayer.userId;

    this.setPhase(
      room,
      "ROLE_REVEAL",
      room.settings.roleRevealSeconds * 1_000,
    );
    this.broadcastState(room.id);
    return ok();
  }

  private confirmRole(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "ROLE_REVEAL") {
      return fail("INVALID_PHASE", "Hiện không ở bước xác nhận vai.");
    }
    if (!player.assignment) {
      return fail("NO_ASSIGNMENT", "Bạn chưa được phát vai.");
    }

    player.hasConfirmedRole = true;
    const allConfirmed = room.players.every(
      (candidate) => candidate.hasConfirmedRole,
    );
    if (allConfirmed) {
      this.enterQuestionRound(room);
    } else {
      this.broadcastState(room.id);
    }
    return ok();
  }

  private enterQuestionRound(room: GlitcherRoom) {
    const seats = room.seatOrderUserIds;
    if (!room.currentScene || seats.length === 0) {
      this.resetToLobby(room);
      this.broadcastState(room.id);
      return;
    }

    const baseCursor = room.questionCursor % seats.length;
    const questionerUserIds = [0, 1, 2].map(
      (offset) => seats[(baseCursor + offset) % seats.length],
    );
    room.questionRound = {
      questionerUserIds,
      currentQuestionerUserId: questionerUserIds[0] ?? null,
      turnIndex: 0,
      stage: "SELECTING",
      selectedQuestionId: null,
      usedQuestionIds: [],
      completedTurns: 0,
      pausedForUserId: null,
      reconnectGraceDeadlineAt: null,
      pausedQuestionRemainingMs: null,
    };
    room.state = "QUESTION_ROUND";
    this.startQuestionSelectionTimer(room);
    this.broadcastState(room.id);
  }

  private startQuestionSelectionTimer(room: GlitcherRoom) {
    this.setPhase(
      room,
      "QUESTION_ROUND",
      room.settings.questionSelectionSeconds * 1_000,
      (latestRoom) => this.autoSelectQuestion(latestRoom),
    );
  }

  private pauseQuestionForReconnect(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ) {
    const round = room.questionRound;
    if (
      room.state !== "QUESTION_ROUND" ||
      !round ||
      round.currentQuestionerUserId !== player.userId ||
      round.pausedForUserId
    ) {
      return;
    }

    const now = Date.now();
    const remainingMs = Math.max(
      1,
      (room.phaseDeadlineAt ?? now) - now,
    );
    this.clearPhaseTimer(room.id);
    this.clearQuestionReconnectTimer(room.id);

    room.phaseId = randomUUID();
    room.phaseStartedAt = now;
    room.phaseDeadlineAt = null;
    round.pausedForUserId = player.userId;
    round.reconnectGraceDeadlineAt =
      now + this.questionReconnectGraceMs;
    round.pausedQuestionRemainingMs = remainingMs;

    const expectedPhaseId = room.phaseId;
    const timer = setTimeout(() => {
      this.questionReconnectTimers.delete(room.id);
      const latestRoom = this.rooms.get(room.id);
      if (
        !latestRoom ||
        latestRoom.phaseId !== expectedPhaseId ||
        latestRoom.state !== "QUESTION_ROUND"
      ) {
        return;
      }
      this.substituteDisconnectedQuestioner(latestRoom);
    }, this.questionReconnectGraceMs);
    this.questionReconnectTimers.set(room.id, timer);
  }

  private resumeQuestionAfterReconnect(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ) {
    const round = room.questionRound;
    if (
      room.state !== "QUESTION_ROUND" ||
      !round ||
      round.pausedForUserId !== player.userId ||
      round.currentQuestionerUserId !== player.userId
    ) {
      return;
    }

    const remainingMs = Math.max(
      1,
      round.pausedQuestionRemainingMs ?? 1,
    );
    this.clearQuestionReconnectTimer(room.id);
    round.pausedForUserId = null;
    round.reconnectGraceDeadlineAt = null;
    round.pausedQuestionRemainingMs = null;
    this.scheduleQuestionContinuation(room, remainingMs);
  }

  private substituteDisconnectedQuestioner(room: GlitcherRoom) {
    const round = room.questionRound;
    if (
      room.state !== "QUESTION_ROUND" ||
      !round ||
      !round.pausedForUserId
    ) {
      return;
    }

    const disconnectedUserId = round.pausedForUserId;
    const substitute = this.findQuestionSubstitute(
      room,
      disconnectedUserId,
    );
    const remainingMs = Math.max(
      1,
      round.pausedQuestionRemainingMs ?? 1,
    );

    if (substitute) {
      round.currentQuestionerUserId = substitute.userId;
      round.questionerUserIds[round.turnIndex] = substitute.userId;
    } else {
      // With no eligible connected seat, keep the automated timeout path alive.
      round.currentQuestionerUserId = null;
    }
    round.pausedForUserId = null;
    round.reconnectGraceDeadlineAt = null;
    round.pausedQuestionRemainingMs = null;
    this.scheduleQuestionContinuation(room, remainingMs);
    this.broadcastState(room.id);
  }

  private findQuestionSubstitute(
    room: GlitcherRoom,
    disconnectedUserId: string,
  ): GlitcherPlayer | undefined {
    const round = room.questionRound;
    if (!round || room.seatOrderUserIds.length === 0) return undefined;

    const reservedQuestioners = new Set(round.questionerUserIds);
    const disconnectedSeat = room.seatOrderUserIds.indexOf(
      disconnectedUserId,
    );
    const startSeat = disconnectedSeat >= 0 ? disconnectedSeat : 0;
    const orderedCandidates = Array.from(
      { length: room.seatOrderUserIds.length - 1 },
      (_, offset) =>
        room.seatOrderUserIds[
          (startSeat + offset + 1) % room.seatOrderUserIds.length
        ],
    );

    const findConnected = (
      allowReservedQuestioner: boolean,
    ): GlitcherPlayer | undefined => {
      for (const userId of orderedCandidates) {
        if (
          userId === disconnectedUserId ||
          (!allowReservedQuestioner && reservedQuestioners.has(userId))
        ) {
          continue;
        }
        const candidate = room.players.find(
          (player) =>
            player.userId === userId && player.status === "connected",
        );
        if (candidate) return candidate;
      }
      return undefined;
    };

    return findConnected(false) ?? findConnected(true);
  }

  private scheduleQuestionContinuation(
    room: GlitcherRoom,
    durationMs: number,
  ) {
    this.clearPhaseTimer(room.id);
    this.clearQuestionReconnectTimer(room.id);
    if (room.questionRound) {
      room.questionRound.pausedForUserId = null;
      room.questionRound.reconnectGraceDeadlineAt = null;
      room.questionRound.pausedQuestionRemainingMs = null;
    }
    const now = Date.now();
    const phaseId = randomUUID();
    const stage = room.questionRound?.stage;
    room.phaseId = phaseId;
    room.phaseStartedAt = now;
    room.phaseDeadlineAt = now + durationMs;

    const timer = setTimeout(() => {
      this.phaseTimers.delete(room.id);
      const latestRoom = this.rooms.get(room.id);
      if (
        !latestRoom ||
        latestRoom.phaseId !== phaseId ||
        latestRoom.state !== "QUESTION_ROUND"
      ) {
        return;
      }
      if (stage === "SELECTING") this.autoSelectQuestion(latestRoom);
      else this.completeQuestionInternal(latestRoom);
    }, durationMs);
    this.phaseTimers.set(room.id, timer);
  }

  private clearQuestionReconnectTimer(roomId: string) {
    const timer = this.questionReconnectTimers.get(roomId);
    if (!timer) return;
    clearTimeout(timer);
    this.questionReconnectTimers.delete(roomId);
  }

  private selectQuestion(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    questionId: unknown,
  ): GlitcherActionAck {
    if (
      room.state !== "QUESTION_ROUND" ||
      !room.questionRound ||
      room.questionRound.stage !== "SELECTING"
    ) {
      return fail("INVALID_PHASE", "Hiện không ở bước chọn câu hỏi.");
    }
    if (room.questionRound.pausedForUserId) {
      return fail(
        "QUESTION_PAUSED",
        "Lượt hỏi đang tạm dừng để chờ người hỏi kết nối lại.",
      );
    }
    if (room.questionRound.currentQuestionerUserId !== player.userId) {
      return fail("NOT_QUESTIONER", "Chưa đến lượt bạn chọn câu hỏi.");
    }
    if (typeof questionId !== "string") {
      return fail("INVALID_QUESTION", "Câu hỏi không hợp lệ.");
    }

    return this.selectQuestionInternal(room, questionId);
  }

  private selectQuestionInternal(
    room: GlitcherRoom,
    questionId: string,
  ): GlitcherActionAck {
    const scene = room.currentScene;
    const round = room.questionRound;
    if (!scene || !round) {
      return fail("NO_ACTIVE_SCENE", "Không có scene đang hoạt động.");
    }
    if (
      !scene.questions.some(
        (_question, index) => getPublicQuestionId(index) === questionId,
      )
    ) {
      return fail("INVALID_QUESTION", "Câu hỏi không thuộc scene hiện tại.");
    }
    if (round.usedQuestionIds.includes(questionId)) {
      return fail("QUESTION_ALREADY_USED", "Câu hỏi này đã được sử dụng.");
    }

    round.selectedQuestionId = questionId;
    round.usedQuestionIds.push(questionId);
    round.stage = "ANSWERING";
    this.setPhase(
      room,
      "QUESTION_ROUND",
      room.settings.questionAnswerSeconds * 1_000,
      (latestRoom) => this.completeQuestionInternal(latestRoom),
    );
    this.broadcastState(room.id);
    return ok();
  }

  private autoSelectQuestion(room: GlitcherRoom) {
    if (
      room.state !== "QUESTION_ROUND" ||
      !room.currentScene ||
      !room.questionRound ||
      room.questionRound.stage !== "SELECTING"
    ) {
      return;
    }
    const unusedQuestions = room.currentScene.questions.filter(
      (_question, index) =>
        !room.questionRound!.usedQuestionIds.includes(
          getPublicQuestionId(index),
        ),
    );
    const selectedQuestion =
      unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
    if (!selectedQuestion) {
      this.completeQuestionInternal(room);
      return;
    }
    const selectedIndex = room.currentScene.questions.indexOf(selectedQuestion);
    this.selectQuestionInternal(room, getPublicQuestionId(selectedIndex));
  }

  private completeQuestion(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (
      room.state !== "QUESTION_ROUND" ||
      !room.questionRound ||
      room.questionRound.stage !== "ANSWERING"
    ) {
      return fail("INVALID_PHASE", "Hiện không ở bước trả lời câu hỏi.");
    }
    if (room.questionRound.pausedForUserId) {
      return fail(
        "QUESTION_PAUSED",
        "Lượt hỏi đang tạm dừng để chờ người hỏi kết nối lại.",
      );
    }
    if (room.questionRound.currentQuestionerUserId !== player.userId) {
      return fail("NOT_QUESTIONER", "Chỉ người đang hỏi mới có thể kết thúc lượt.");
    }
    this.completeQuestionInternal(room);
    return ok();
  }

  private completeQuestionInternal(room: GlitcherRoom) {
    const round = room.questionRound;
    if (!round || room.state !== "QUESTION_ROUND") return;

    this.clearPhaseTimer(room.id);
    round.completedTurns += 1;
    room.questionCursor =
      (room.questionCursor + 1) % Math.max(1, room.seatOrderUserIds.length);

    if (round.completedTurns >= 3) {
      room.questionRound = {
        ...round,
        currentQuestionerUserId: null,
      };
      this.enterPerformanceSetup(room);
      return;
    }

    round.turnIndex += 1;
    round.currentQuestionerUserId =
      round.questionerUserIds[round.turnIndex] ?? null;
    round.stage = "SELECTING";
    round.selectedQuestionId = null;
    round.pausedForUserId = null;
    round.reconnectGraceDeadlineAt = null;
    round.pausedQuestionRemainingMs = null;
    this.startQuestionSelectionTimer(room);
    this.broadcastState(room.id);
  }

  private enterPerformanceSetup(room: GlitcherRoom) {
    this.setPhase(
      room,
      "PERFORMANCE_SETUP",
      room.settings.performanceSetupSeconds * 1_000,
      (latestRoom) => this.enterPerformance(latestRoom),
    );
    this.broadcastState(room.id);
  }

  private enterPerformance(room: GlitcherRoom) {
    this.setPhase(
      room,
      "PERFORMANCE",
      room.settings.performanceSeconds * 1_000,
      (latestRoom) => this.enterDiscussion(latestRoom),
    );
    this.broadcastState(room.id);
  }

  private enterDiscussion(room: GlitcherRoom) {
    const seconds = getGlitcherDiscussionSeconds(room.players.length);
    this.setPhase(room, "DISCUSSION", seconds * 1_000, (latestRoom) =>
      this.enterVoting(latestRoom),
    );
    this.broadcastState(room.id);
  }

  private enterVoting(room: GlitcherRoom) {
    room.votes = {};
    room.players.forEach((player) => {
      player.hasVoted = false;
    });
    this.setPhase(
      room,
      "VOTING",
      room.settings.votingSeconds * 1_000,
      (latestRoom) => this.resolveVoting(latestRoom, true),
    );
    this.broadcastState(room.id);
  }

  private submitVote(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    targetUserId: unknown,
  ): GlitcherActionAck {
    if (room.state !== "VOTING") {
      return fail("INVALID_PHASE", "Hiện không ở bước bỏ phiếu.");
    }
    if (player.hasVoted || room.votes[player.userId]) {
      return fail("VOTE_LOCKED", "Phiếu của bạn đã được khóa.");
    }
    if (typeof targetUserId !== "string" || targetUserId === player.userId) {
      return fail("INVALID_VOTE", "Bạn không thể bỏ phiếu cho chính mình.");
    }
    const target = room.players.find(
      (candidate) => candidate.userId === targetUserId,
    );
    if (!target) {
      return fail("INVALID_VOTE", "Người được chọn không còn trong scene.");
    }

    room.votes[player.userId] = {
      voterUserId: player.userId,
      targetUserId: target.userId,
      submittedAt: Date.now(),
      timedOut: false,
    };
    player.hasVoted = true;

    if (room.players.every((candidate) => candidate.hasVoted)) {
      this.resolveVoting(room, false);
    } else {
      this.broadcastState(room.id);
    }
    return ok();
  }

  private resolveVoting(room: GlitcherRoom, timedOut: boolean) {
    if (room.state !== "VOTING" || !room.currentScene || !room.glitchUserId) {
      return;
    }
    this.clearPhaseTimer(room.id);

    if (timedOut) {
      room.players.forEach((player) => {
        if (room.votes[player.userId]) return;
        room.votes[player.userId] = {
          voterUserId: player.userId,
          targetUserId: null,
          submittedAt: null,
          timedOut: true,
        };
      });
    }

    const glitchPlayer = room.players.find(
      (player) => player.userId === room.glitchUserId,
    );
    if (!glitchPlayer) {
      this.resetToLobby(room);
      this.broadcastState(room.id);
      return;
    }

    const votesForGlitch = room.players.filter(
      (player) =>
        player.userId !== glitchPlayer.userId &&
        room.votes[player.userId]?.targetUserId === glitchPlayer.userId,
    ).length;

    const scores: GlitcherScoreDelta[] = room.players.map((player) => {
      const delta =
        player.userId === glitchPlayer.userId
          ? scoreGlitcher(room.players.length, votesForGlitch)
          : room.votes[player.userId]?.targetUserId === glitchPlayer.userId
            ? 1
            : 0;
      player.sceneScore = delta;
      player.totalScore += delta;
      return {
        userId: player.userId,
        playerName: player.name,
        delta,
      };
    });

    const reveal: GlitcherSceneReveal = {
      sceneNumber: room.sceneNumber,
      trueScene: {
        title: room.currentScene.title,
        description: room.currentScene.description,
      },
      glitchScene: {
        title: room.currentScene.glitch_scene.title,
        description: room.currentScene.glitch_scene.description,
      },
      glitchUserId: glitchPlayer.userId,
      glitchPlayerName: glitchPlayer.name,
      votes: room.players.map((player) => {
        const vote = room.votes[player.userId];
        const target = vote?.targetUserId
          ? room.players.find(
              (candidate) => candidate.userId === vote.targetUserId,
            )
          : undefined;
        return {
          voterUserId: player.userId,
          voterName: player.name,
          targetUserId: vote?.targetUserId ?? null,
          targetName: target?.name ?? null,
          timedOut: vote?.timedOut ?? true,
        };
      }),
      scores,
      revealedAt: Date.now(),
    };
    room.latestReveal = reveal;
    room.sceneResults.push(reveal);
    this.setPhase(room, "REVEAL", null);
    this.broadcastState(room.id);
  }

  private nextScene(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "REVEAL") {
      return fail("INVALID_PHASE", "Chỉ có thể tiếp tục sau khi reveal.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể mở scene tiếp theo.");
    }

    if (room.sceneNumber >= room.settings.scenesPerTour) {
      this.enterTourSummary(room);
      this.broadcastState(room.id);
      return ok();
    }
    return this.beginScene(room, true);
  }

  private enterTourSummary(room: GlitcherRoom) {
    const sorted = [...room.players].sort(
      (left, right) =>
        right.totalScore - left.totalScore ||
        left.seatIndex - right.seatIndex,
    );
    let previousScore: number | null = null;
    let previousRank = 0;
    const rankedPlayers = sorted.map((player, index) => {
      const rank =
        previousScore === player.totalScore ? previousRank : index + 1;
      previousScore = player.totalScore;
      previousRank = rank;
      return {
        rank,
        userId: player.userId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        totalScore: player.totalScore,
      };
    });
    const topScore = rankedPlayers[0]?.totalScore;
    const summary: GlitcherTourSummary = {
      tourNumber: room.tourNumber,
      rankedPlayers,
      winnerUserIds:
        topScore === undefined
          ? []
          : rankedPlayers
              .filter((player) => player.totalScore === topScore)
              .map((player) => player.userId),
    };
    room.tourSummary = summary;
    this.setPhase(room, "TOUR_SUMMARY", null);
  }

  private returnToLobby(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state === "LOBBY") {
      return fail("INVALID_PHASE", "Phòng đã ở lobby.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể đưa phòng về lobby.");
    }
    this.resetToLobby(room);
    this.broadcastState(room.id);
    return ok();
  }

  private transferHost(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    targetUserId: unknown,
  ): GlitcherActionAck {
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể chuyển quyền.");
    }
    if (typeof targetUserId !== "string") {
      return fail("INVALID_TARGET", "Người nhận quyền không hợp lệ.");
    }
    const target = room.players.find(
      (candidate) =>
        candidate.userId === targetUserId &&
        candidate.status === "connected" &&
        candidate.userId !== player.userId,
    );
    if (!target) {
      return fail("INVALID_TARGET", "Không tìm thấy người nhận quyền đang online.");
    }
    player.isHost = false;
    target.isHost = true;
    this.broadcastState(room.id);
    return ok();
  }

  private explicitLeave(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    socket: Socket,
  ): GlitcherActionAck {
    const wasActiveScene = ACTIVE_SCENE_STATES.has(room.state);
    const removedSeatIndex = room.seatOrderUserIds.indexOf(player.userId);
    room.players = room.players.filter(
      (candidate) => candidate.userId !== player.userId,
    );
    room.seatOrderUserIds = room.seatOrderUserIds.filter(
      (userId) => userId !== player.userId,
    );
    this.adjustQuestionCursorAfterSeatRemoval(room, removedSeatIndex);
    this.ensureHost(room);
    this.reindexPlayers(room);

    socket.leave(room.id);
    delete socket.data.roomId;
    delete socket.data.userId;

    if (room.players.length === 0) {
      this.deleteRoom(room.id);
      return ok();
    }

    if (wasActiveScene) {
      this.clearPhaseTimer(room.id);
      if (room.players.length < room.settings.minPlayers) {
        this.resetToLobby(room);
      } else {
        const replacement = this.beginScene(room, false);
        if (!replacement.ok) {
          this.broadcastState(room.id);
          return replacement;
        }
        return ok("SCENE_REDEALT");
      }
    } else if (
      room.state === "REVEAL" &&
      room.sceneNumber < room.settings.scenesPerTour &&
      room.players.length < room.settings.minPlayers
    ) {
      this.resetToLobby(room);
    } else if (room.state === "TOUR_SUMMARY") {
      this.enterTourSummary(room);
    }

    this.broadcastState(room.id);
    return ok();
  }

  private adjustQuestionCursorAfterSeatRemoval(
    room: GlitcherRoom,
    removedSeatIndex: number,
  ) {
    if (removedSeatIndex >= 0 && removedSeatIndex < room.questionCursor) {
      room.questionCursor -= 1;
    }
    room.questionCursor =
      room.seatOrderUserIds.length === 0
        ? 0
        : room.questionCursor % room.seatOrderUserIds.length;
  }

  private resetToLobby(room: GlitcherRoom) {
    this.clearPhaseTimer(room.id);
    this.clearQuestionReconnectTimer(room.id);
    room.players = room.players.filter(
      (player) => player.status === "connected",
    );
    this.ensureHost(room);
    this.reindexPlayers(room);
    room.state = "LOBBY";
    room.sceneNumber = 0;
    room.seatOrderUserIds = [];
    room.sceneDeckIds = [];
    room.usedSceneIds = [];
    room.currentScene = undefined;
    room.glitchUserId = undefined;
    room.questionRound = null;
    room.votes = {};
    room.sceneResults = [];
    room.latestReveal = null;
    room.tourSummary = null;
    room.phaseId = randomUUID();
    room.phaseStartedAt = Date.now();
    room.phaseDeadlineAt = null;
    room.players.forEach((player) => {
      player.isReady = false;
      player.hasConfirmedRole = false;
      player.hasVoted = false;
      player.totalScore = 0;
      player.sceneScore = 0;
      delete player.assignment;
    });
  }

  private handleDisconnect(socket: Socket) {
    const room = this.getSocketRoom(socket);
    if (!room) return;
    const player = room.players.find(
      (candidate) => candidate.id === socket.id,
    );
    if (!player) return;

    if (room.state === "LOBBY") {
      room.players = room.players.filter(
        (candidate) => candidate.userId !== player.userId,
      );
      this.ensureHost(room);
      this.reindexPlayers(room);
      if (room.players.length === 0) {
        this.scheduleEmptyRoomCleanup(room.id);
        return;
      }
    } else {
      player.status = "disconnected";
      this.pauseQuestionForReconnect(room, player);
      if (
        !room.players.some(
          (candidate) => candidate.status === "connected",
        )
      ) {
        this.scheduleEmptyRoomCleanup(room.id);
      }
    }
    this.broadcastState(room.id);
  }

  private ensureHost(room: GlitcherRoom) {
    if (room.players.length === 0) return;
    const host = room.players.find((player) => player.isHost);
    if (host) return;
    const nextHost =
      room.players.find((player) => player.status === "connected") ??
      room.players[0];
    nextHost.isHost = true;
  }

  private reindexPlayers(room: GlitcherRoom) {
    room.players.forEach((player, index) => {
      player.seatIndex = index;
    });
  }

  private setPhase(
    room: GlitcherRoom,
    state: GlitcherGameState,
    durationMs: number | null,
    onTimeout?: (room: GlitcherRoom) => void,
  ) {
    this.clearPhaseTimer(room.id);
    this.clearQuestionReconnectTimer(room.id);
    if (room.questionRound) {
      room.questionRound.pausedForUserId = null;
      room.questionRound.reconnectGraceDeadlineAt = null;
      room.questionRound.pausedQuestionRemainingMs = null;
    }
    const now = Date.now();
    const phaseId = randomUUID();
    room.state = state;
    room.phaseId = phaseId;
    room.phaseStartedAt = now;
    room.phaseDeadlineAt = durationMs === null ? null : now + durationMs;

    if (durationMs === null || !onTimeout) return;
    const timer = setTimeout(() => {
      this.phaseTimers.delete(room.id);
      const latestRoom = this.rooms.get(room.id);
      if (!latestRoom || latestRoom.phaseId !== phaseId) return;
      onTimeout(latestRoom);
    }, durationMs);
    this.phaseTimers.set(room.id, timer);
  }

  private clearPhaseTimer(roomId: string) {
    const timer = this.phaseTimers.get(roomId);
    if (!timer) return;
    clearTimeout(timer);
    this.phaseTimers.delete(roomId);
  }

  private scheduleEmptyRoomCleanup(roomId: string) {
    this.clearEmptyRoomCleanup(roomId);
    const timer = setTimeout(() => {
      this.emptyRoomCleanupTimers.delete(roomId);
      const room = this.rooms.get(roomId);
      if (!room) return;
      if (
        room.players.some((player) => player.status === "connected")
      ) {
        return;
      }
      this.deleteRoom(roomId);
    }, EMPTY_ROOM_CLEANUP_MS);
    this.emptyRoomCleanupTimers.set(roomId, timer);
  }

  private clearEmptyRoomCleanup(roomId: string) {
    const timer = this.emptyRoomCleanupTimers.get(roomId);
    if (!timer) return;
    clearTimeout(timer);
    this.emptyRoomCleanupTimers.delete(roomId);
  }

  private deleteRoom(roomId: string) {
    this.clearPhaseTimer(roomId);
    this.clearQuestionReconnectTimer(roomId);
    this.clearEmptyRoomCleanup(roomId);
    this.rooms.delete(roomId);
  }

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    void this.io
      .in(roomId)
      .fetchSockets()
      .then((socketList) => {
        const latestRoom = this.rooms.get(roomId);
        if (!latestRoom) return;
        socketList.forEach((socket) => {
          const userId = socket.data.userId as string | undefined;
          const viewer = userId
            ? latestRoom.players.find(
                (player) =>
                  player.userId === userId && player.id === socket.id,
              )
            : undefined;
          socket.emit(
            "stateUpdate",
            this.buildClientState(latestRoom, viewer),
          );
        });
      })
      .catch((error: unknown) => {
        console.error("Unable to broadcast Glitcher state:", error);
      });
  }

  private buildClientState(
    room: GlitcherRoom,
    viewer: GlitcherPlayer | undefined,
  ): GlitcherClientState {
    const sceneIsVisible =
      room.state !== "LOBBY" && room.state !== "TOUR_SUMMARY";
    const questions =
      sceneIsVisible && room.currentScene
        ? room.currentScene.questions.map((question, index) => ({
            id: getPublicQuestionId(index),
            text: question.text,
          }))
        : [];

    let privateCard: GlitcherPrivateCard | null = null;
    if (sceneIsVisible && room.currentScene && viewer?.assignment) {
      const assignment = viewer.assignment;
      const privateScene = assignment.isGlitch
        ? room.currentScene.glitch_scene
        : room.currentScene;
      privateCard = {
        scene: {
          title: privateScene.title,
          description: privateScene.description,
        },
        role: {
          name: assignment.role.name,
          action: assignment.role.action,
        },
        answers: room.currentScene.questions.map(
          (question) => assignment.role.answers[question.id],
        ),
      };
    }

    const publicPlayers: GlitcherPublicPlayer[] = room.players.map(
      (player) => ({
        userId: player.userId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        seatIndex: player.seatIndex,
        isHost: player.isHost,
        status: player.status,
        isReady: player.isReady,
        hasConfirmedRole: player.hasConfirmedRole,
        hasVoted: player.hasVoted,
      }),
    );

    const questionRound: GlitcherQuestionRound | null =
      room.state === "QUESTION_ROUND" && room.questionRound
        ? {
            questionerUserIds: [...room.questionRound.questionerUserIds],
            currentQuestionerUserId:
              room.questionRound.currentQuestionerUserId,
            turnIndex: room.questionRound.turnIndex,
            stage: room.questionRound.stage,
            selectedQuestionId: room.questionRound.selectedQuestionId,
            usedQuestionIds: [...room.questionRound.usedQuestionIds],
            completedTurns: room.questionRound.completedTurns,
            pausedForUserId: room.questionRound.pausedForUserId,
            reconnectGraceDeadlineAt:
              room.questionRound.reconnectGraceDeadlineAt,
            pausedQuestionRemainingMs:
              room.questionRound.pausedQuestionRemainingMs,
          }
        : null;

    return {
      roomId: room.id,
      state: room.state,
      settings: { ...room.settings },
      players: publicPlayers,
      viewerUserId: viewer?.userId ?? null,
      reconnectToken: viewer?.reconnectToken ?? null,
      tourNumber: room.tourNumber,
      sceneNumber: room.sceneNumber,
      totalScenes: room.settings.scenesPerTour,
      discussionSeconds: getGlitcherDiscussionSeconds(room.players.length),
      phaseId: room.phaseId,
      phaseStartedAt: room.phaseStartedAt,
      phaseDeadlineAt: room.phaseDeadlineAt,
      questions,
      privateCard,
      questionRound,
      voteProgress:
        room.state === "VOTING"
          ? {
              submitted: room.players.filter((player) => player.hasVoted)
                .length,
              required: room.players.length,
            }
          : null,
      latestReveal:
        room.state === "REVEAL" || room.state === "TOUR_SUMMARY"
          ? room.latestReveal
          : null,
      tourSummary:
        room.state === "TOUR_SUMMARY" ? room.tourSummary : null,
    };
  }
}
