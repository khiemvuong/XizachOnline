import { randomUUID } from "node:crypto";
import type { Namespace, Server, Socket } from "socket.io";
import {
  GLITCHER_SCENES,
  GLITCHER_SETTINGS,
  shuffleGlitcherItems,
} from "./GlitcherData";
import { GLITCHER_NAMESPACE } from "./GlitcherTypes";
import type {
  GlitcherActionAck,
  GlitcherActionPayload,
  GlitcherAnswerLogEntry,
  GlitcherAnswerQuestionPayload,
  GlitcherAssignment,
  GlitcherClientState,
  GlitcherJoinRoomPayload,
  GlitcherOutcome,
  GlitcherPlayer,
  GlitcherPrivateCard,
  GlitcherPublicPlayer,
  GlitcherRoom,
  GlitcherSceneReveal,
  GlitcherSelectQuestionPayload,
  GlitcherSelectScenePayload,
  GlitcherSubmitVotePayload,
  GlitcherTransferHostPayload,
} from "./GlitcherTypes";
import {
  MAX_SPECTATORS_PER_ROOM,
  issueReconnectCapability,
  markConnectionAbandoned,
  markConnectionInterrupted,
  markConnectionRestored,
  verifyReconnectCapability,
} from "./shared/connection";
import { disabledGameplayTimer } from "./shared/timing";

type ActionAckCallback = (ack: GlitcherActionAck) => void;
type BooleanAckCallback = (result: boolean) => void;

const ROOM_CODE_PATTERN = /^\d{6}$/;
const MAX_PLAYER_NAME_LENGTH = 24;
const MAX_USER_ID_LENGTH = 160;
const MAX_ACTION_ID_LENGTH = 160;
const MAX_PROCESSED_ACTIONS_PER_ROOM = 2_048;
const EMPTY_ROOM_CLEANUP_MS = 5 * 60 * 1_000;

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

export class GlitcherEngine {
  private readonly io: Namespace;
  private readonly rooms = new Map<string, GlitcherRoom>();
  private readonly emptyRoomCleanupTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly reconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(server: Server) {
    this.io = server.of(GLITCHER_NAMESPACE);
    this.setupListeners();
  }

  public dispose() {
    this.emptyRoomCleanupTimers.forEach((timer) => clearTimeout(timer));
    this.emptyRoomCleanupTimers.clear();
    this.reconnectGraceTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectGraceTimers.clear();
    this.rooms.clear();
  }

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      socket.on("checkRoom", (roomId: string, callback: BooleanAckCallback) => {
        if (typeof callback !== "function") return;
        callback(
          typeof roomId === "string" &&
            ROOM_CODE_PATTERN.test(roomId) &&
            this.rooms.has(roomId),
        );
      });

      socket.on("createRoom", (roomId: string, callback: BooleanAckCallback) => {
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
      });

      socket.on("joinRoom", (payload: GlitcherJoinRoomPayload) => {
        void this.joinRoom(socket, payload);
      });

      socket.on(
        "selectScene",
        (payload: GlitcherSelectScenePayload, callback?: ActionAckCallback) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.selectScene(room, player, payload.sceneIndex),
          );
        },
      );

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
        "answerQuestion",
        (
          payload: GlitcherAnswerQuestionPayload,
          callback?: ActionAckCallback,
        ) => {
          this.runRoomAction(socket, payload, callback, (room, player) =>
            this.answerQuestion(room, player, payload.answer),
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
          this.runRoomAction(
            socket,
            payload,
            callback,
            (room, player) => this.explicitLeave(room, player, socket),
            { allowSpectator: true },
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
        if (
          !room ||
          !player ||
          player.id !== socket.id ||
          !normalizedName ||
          room.state !== "LOBBY"
        ) return;
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
    const room: GlitcherRoom = {
      id: roomId,
      players: [],
      state: "LOBBY",
      settings: { ...GLITCHER_SETTINGS },
      timing: {
        roleReveal: disabledGameplayTimer(),
        question: disabledGameplayTimer(),
        answer: disabledGameplayTimer(),
        vote: disabledGameplayTimer(),
      },
      selectedSceneIndex: null,
      totalAvailableScenes: GLITCHER_SCENES.length,
      sceneNumber: 0,
      seatOrderUserIds: [],
      usedSceneIds: [],
      phaseId: randomUUID(),
      questionRound: null,
      answerLog: [],
      votes: {},
      latestReveal: null,
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
      socket.emit("glitcherError", "Socket này đã được gắn với một ghế khác.");
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
      if (
        !isCurrentSocket &&
        !verifyReconnectCapability(existing.reconnectTokenHash, reconnectToken)
      ) {
        socket.emit(
          "glitcherError",
          "Không thể khôi phục ghế: reconnect token không hợp lệ.",
        );
        return;
      }

      if (!isCurrentSocket) {
        const previousSocket = this.io.sockets.get(existing.id);
        existing.id = socket.id;
        previousSocket?.emit("sessionReplaced");
        previousSocket?.disconnect(true);
      }
      existing.name = playerName;
      if (avatarUrl) existing.avatarUrl = avatarUrl;
      existing.status = "connected";
      markConnectionRestored(existing);
      this.clearReconnectGrace(room.id, existing.userId);
      const capability = issueReconnectCapability();
      existing.reconnectTokenHash = capability.reconnectTokenHash;

      socket.data.roomId = room.id;
      socket.data.userId = existing.userId;
      await socket.join(room.id);
      socket.emit("sessionEstablished", { reconnectToken: capability.reconnectToken });
      this.clearEmptyRoomCleanup(room.id);
      this.broadcastState(room.id);
      return;
    }

    const isSpectator = room.state !== "LOBBY";
    if (
      isSpectator &&
      room.players.filter((player) => player.isSpectator).length >= MAX_SPECTATORS_PER_ROOM
    ) {
      socket.emit("glitcherError", {
        code: "SPECTATOR_LIMIT_REACHED",
        message: `Phòng đã đủ ${MAX_SPECTATORS_PER_ROOM} khán giả.`,
      });
      return;
    }

    const seatedPlayers = this.getSeatedPlayers(room);
    if (!isSpectator && seatedPlayers.length >= room.settings.maxPlayers) {
      socket.emit("glitcherError", "Phòng đã đủ số lượng người chơi.");
      return;
    }

    const isHost = seatedPlayers.length === 0;
    const capability = issueReconnectCapability();
    const newPlayer: GlitcherPlayer = {
      id: socket.id,
      userId,
      reconnectTokenHash: capability.reconnectTokenHash,
      name: playerName,
      avatarUrl,
      seatIndex: isSpectator ? -1 : seatedPlayers.length,
      isHost: isHost && !isSpectator,
      isSpectator,
      status: "connected",
      connectionState: "connected",
      isReady: isHost && !isSpectator,
      hasConfirmedRole: false,
      hasVoted: false,
    };

    room.players.push(newPlayer);
    socket.data.roomId = room.id;
    socket.data.userId = newPlayer.userId;
    await socket.join(room.id);
    socket.emit("sessionEstablished", { reconnectToken: capability.reconnectToken });
    this.clearEmptyRoomCleanup(room.id);
    this.broadcastState(room.id);
  }

  private runRoomAction(
    socket: Socket,
    payload: unknown,
    callback: ActionAckCallback | undefined,
    action: (room: GlitcherRoom, player: GlitcherPlayer) => GlitcherActionAck,
    options: { allowSpectator?: boolean } = {},
  ) {
    if (!isObject(payload)) {
      this.respondToAction(socket, callback, fail("BAD_PAYLOAD", "Payload không hợp lệ."));
      return;
    }

    const actionId = normalizeActionId(payload.actionId);
    if (!actionId) {
      this.respondToAction(
        socket,
        callback,
        fail("BAD_ACTION_ID", "actionId không hợp lệ."),
      );
      return;
    }

    const room = this.getSocketRoom(socket);
    const userId = socket.data.userId as string | undefined;
    const player = userId
      ? room?.players.find((candidate) => candidate.userId === userId)
      : undefined;

    if (
      !room ||
      !player ||
      player.id !== socket.id ||
      player.status !== "connected" ||
      (player.isSpectator && !options.allowSpectator)
    ) {
      this.respondToAction(
        socket,
        callback,
        fail("UNAUTHORIZED", "Người chơi hoặc phòng không hợp lệ."),
      );
      return;
    }

    const actionKey = `${player.userId}:${actionId}`;
    const cachedAck = room.processedActionIds.get(actionKey);
    if (cachedAck) {
      this.respondToAction(socket, callback, cachedAck.ack);
      return;
    }

    const result = action(room, player);
    room.processedActionIds.set(actionKey, {
      processedAt: Date.now(),
      ack: result,
    });
    while (room.processedActionIds.size > MAX_PROCESSED_ACTIONS_PER_ROOM) {
      const oldestKey = room.processedActionIds.keys().next().value as string | undefined;
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

  private selectScene(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    sceneIndex: unknown,
  ): GlitcherActionAck {
    if (room.state !== "LOBBY") {
      return fail("INVALID_PHASE", "Chỉ có thể chọn màn chơi ở Lobby.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có quyền chọn màn chơi.");
    }

    if (sceneIndex === null || sceneIndex === undefined) {
      room.selectedSceneIndex = null;
    } else if (
      typeof sceneIndex === "number" &&
      Number.isInteger(sceneIndex) &&
      sceneIndex >= 0 &&
      sceneIndex < GLITCHER_SCENES.length
    ) {
      room.selectedSceneIndex = sceneIndex;
    } else {
      return fail("INVALID_SCENE_INDEX", "Màn chơi chọn không hợp lệ.");
    }

    this.broadcastState(room.id);
    return ok();
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
    if (room.state !== "LOBBY" && room.state !== "REVEAL") {
      return fail("INVALID_PHASE", "Chỉ có thể bắt đầu trận từ lobby hoặc sau khi kết thúc.");
    }
    if (!player.isHost) {
      return fail("HOST_ONLY", "Chỉ chủ phòng mới có thể bắt đầu trận đấu.");
    }

    const connectedPlayers = this.getSeatedPlayers(room).filter(
      (p) => p.status === "connected",
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
      room.state === "LOBBY" &&
      connectedPlayers.some((candidate) => !candidate.isReady)
    ) {
      return fail(
        "PLAYERS_NOT_READY",
        "Tất cả người chơi phải sẵn sàng trước khi bắt đầu.",
      );
    }

    const spectators = room.players.filter((candidate) => candidate.isSpectator);
    room.players = [...connectedPlayers, ...spectators];
    this.ensureHost(room);
    this.reindexPlayers(room);
    room.sceneNumber += 1;
    room.seatOrderUserIds = connectedPlayers.map((p) => p.userId);
    room.answerLog = [];
    room.votes = {};
    room.latestReveal = null;

    connectedPlayers.forEach((p) => {
      p.isReady = false;
      p.hasConfirmedRole = false;
      p.hasVoted = false;
      delete p.assignment;
    });

    // Select scene
    let sceneToPlay =
      room.selectedSceneIndex !== null
        ? GLITCHER_SCENES[room.selectedSceneIndex]
        : undefined;

    if (!sceneToPlay) {
      sceneToPlay = GLITCHER_SCENES[Math.floor(Math.random() * GLITCHER_SCENES.length)];
    }

    if (!sceneToPlay) {
      return fail("NO_SCENE", "Không thể tải dữ liệu màn chơi.");
    }

    room.currentScene = sceneToPlay;

    const playerCount = connectedPlayers.length;
    const isDualGlitch = playerCount > 10;
    const glitchSlots = isDualGlitch ? 2 : 1;
    const trueRoles = sceneToPlay.roles.slice(0, playerCount - glitchSlots);

    // Pick glitch role(s): for dual glitch each picks one of the 2 available glitch roles
    const glitchRoles = sceneToPlay.glitch_scene.roles;

    // Randomly select glitch player(s) — must be distinct
    const shuffledPlayers = shuffleGlitcherItems(connectedPlayers);
    const glitchPlayers = shuffledPlayers.slice(0, glitchSlots);

    const shuffledTrueRoles = shuffleGlitcherItems(trueRoles);
    let roleIndex = 0;

    connectedPlayers.forEach((scenePlayer) => {
      const glitchIndex = glitchPlayers.findIndex((gp) => gp.userId === scenePlayer.userId);
      const isGlitch = glitchIndex !== -1;
      // For dual glitch: glitchIndex 0 gets roles[0], glitchIndex 1 gets roles[1]
      // For single glitch: glitchIndex 0 gets a random role from glitchRoles
      const glitchRole = isDualGlitch
        ? (glitchRoles[glitchIndex] ?? glitchRoles[0])
        : glitchRoles[Math.floor(Math.random() * glitchRoles.length)];
      const assignment: GlitcherAssignment = {
        sceneId: sceneToPlay.id,
        role: isGlitch ? glitchRole : shuffledTrueRoles[roleIndex++],
        isGlitch,
      };
      scenePlayer.assignment = assignment;
      scenePlayer.hasConfirmedRole = false;
      scenePlayer.hasVoted = false;
    });

    room.glitchUserId = glitchPlayers[0].userId;
    room.glitchUserIds = glitchPlayers.map((p) => p.userId);
    room.phaseId = randomUUID();
    room.state = "ROLE_REVEAL";
    this.broadcastState(room.id);
    return ok();
  }

  private confirmRole(
    room: GlitcherRoom,
    player: GlitcherPlayer,
  ): GlitcherActionAck {
    if (room.state !== "ROLE_REVEAL") {
      return fail("INVALID_PHASE", "Hiện không ở bước xem vai.");
    }
    if (!player.assignment) {
      return fail("NO_ASSIGNMENT", "Bạn chưa được phát vai.");
    }

    player.hasConfirmedRole = true;
    const allConfirmed = this.getSeatedPlayers(room).every(
      (candidate) => candidate.hasConfirmedRole,
    );

    if (allConfirmed) {
      this.startPerformanceAndQuestions(room);
    } else {
      this.broadcastState(room.id);
    }
    return ok();
  }

  private startPerformanceAndQuestions(room: GlitcherRoom) {
    if (room.seatOrderUserIds.length === 0) {
      this.resetToLobby(room);
      this.broadcastState(room.id);
      return;
    }
    this.setupPerformerTurn(room, 0);
  }

  private setupPerformerTurn(room: GlitcherRoom, performerIndex: number) {
    const seats = room.seatOrderUserIds;
    if (performerIndex >= seats.length) {
      // All performers have finished! Move to Discussion & Voting phase.
      this.enterDiscussion(room);
      return;
    }

    const targetUserId = seats[performerIndex];

    // Pick 3 questioners in seat order right after targetUserId
    const questionerUserIds: string[] = [];
    for (let i = 1; i < seats.length && questionerUserIds.length < 3; i++) {
      const candidateUserId = seats[(performerIndex + i) % seats.length];
      if (candidateUserId !== targetUserId) {
        questionerUserIds.push(candidateUserId);
      }
    }

    room.questionRound = {
      targetUserId,
      performerIndex,
      totalPerformers: seats.length,
      questionerUserIds,
      currentQuestionerUserId: questionerUserIds[0] ?? null,
      turnIndex: 0,
      stage: "SELECTING",
      selectedQuestionId: null,
      usedQuestionIds: [],
    };

    room.state = "PERFORMANCE_AND_QUESTIONS";
    room.phaseId = randomUUID();
    this.broadcastState(room.id);
  }

  private selectQuestion(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    questionId: unknown,
  ): GlitcherActionAck {
    if (
      room.state !== "PERFORMANCE_AND_QUESTIONS" ||
      !room.questionRound ||
      room.questionRound.stage !== "SELECTING"
    ) {
      return fail("INVALID_PHASE", "Hiện không ở bước chọn câu hỏi.");
    }
    if (room.questionRound.currentQuestionerUserId !== player.userId) {
      return fail("NOT_QUESTIONER", "Chưa đến lượt bạn chọn câu hỏi.");
    }
    if (typeof questionId !== "string") {
      return fail("INVALID_QUESTION", "Câu hỏi không hợp lệ.");
    }

    const scene = room.currentScene;
    const round = room.questionRound;
    if (!scene || !round) {
      return fail("NO_ACTIVE_SCENE", "Không có màn chơi đang diễn ra.");
    }

    if (
      !scene.questions.some(
        (_q, index) => getPublicQuestionId(index) === questionId,
      )
    ) {
      return fail("INVALID_QUESTION", "Câu hỏi không thuộc màn chơi hiện tại.");
    }

    round.selectedQuestionId = questionId;
    round.usedQuestionIds.push(questionId);
    round.stage = "ANSWERING";
    this.broadcastState(room.id);
    return ok();
  }

  private answerQuestion(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    answer: unknown,
  ): GlitcherActionAck {
    if (
      room.state !== "PERFORMANCE_AND_QUESTIONS" ||
      !room.questionRound ||
      room.questionRound.stage !== "ANSWERING"
    ) {
      return fail("INVALID_PHASE", "Hiện không ở bước trả lời câu hỏi.");
    }

    const round = room.questionRound;
    if (round.targetUserId !== player.userId) {
      return fail("NOT_TARGET", "Chỉ người đang diễn mới được trả lời câu hỏi.");
    }

    if (typeof answer !== "boolean") {
      return fail("INVALID_ANSWER", "Câu trả lời phải là Có (true) hoặc Không (false).");
    }

    const questioner = room.players.find(
      (p) => p.userId === round.currentQuestionerUserId,
    );
    const questionIndex = round.selectedQuestionId
      ? parseInt(round.selectedQuestionId.replace("q-", ""), 10) - 1
      : -1;
    const question =
      room.currentScene && questionIndex >= 0
        ? room.currentScene.questions[questionIndex]
        : undefined;

    const logEntry: GlitcherAnswerLogEntry = {
      id: randomUUID(),
      targetUserId: player.userId,
      targetName: player.name,
      questionerUserId: questioner?.userId ?? "",
      questionerName: questioner?.name ?? "Người hỏi",
      questionText: question?.text ?? "Câu hỏi",
      answer,
    };

    room.answerLog.push(logEntry);

    // Advance question turn
    round.turnIndex += 1;
    if (
      round.turnIndex < 3 &&
      round.turnIndex < round.questionerUserIds.length
    ) {
      round.currentQuestionerUserId =
        round.questionerUserIds[round.turnIndex] ?? null;
      round.stage = "SELECTING";
      round.selectedQuestionId = null;
    } else {
      // Finished 3 questions for current target, setup next performer
      this.setupPerformerTurn(room, round.performerIndex + 1);
      return ok();
    }

    this.broadcastState(room.id);
    return ok();
  }

  private enterDiscussion(room: GlitcherRoom) {
    room.state = "DISCUSSION";
    room.questionRound = null;
    room.phaseId = randomUUID();
    room.votes = {};
    this.getSeatedPlayers(room).forEach((p) => {
      p.hasVoted = false;
    });
    this.broadcastState(room.id);
  }

  private submitVote(
    room: GlitcherRoom,
    player: GlitcherPlayer,
    targetUserId: unknown,
  ): GlitcherActionAck {
    if (room.state !== "DISCUSSION") {
      return fail("INVALID_PHASE", "Hiện không ở bước thảo luận & vote.");
    }
    if (player.hasVoted || room.votes[player.userId]) {
      return fail("VOTE_LOCKED", "Phiếu của bạn đã được ghi nhận.");
    }
    if (typeof targetUserId !== "string" || targetUserId === player.userId) {
      return fail("INVALID_VOTE", "Bạn không thể vote cho chính mình.");
    }
    const target = room.players.find(
      (candidate) => candidate.userId === targetUserId,
    );
    if (!target) {
      return fail("INVALID_VOTE", "Người được chọn không còn trong trận.");
    }

    room.votes[player.userId] = {
      voterUserId: player.userId,
      targetUserId: target.userId,
      submittedAt: Date.now(),
      timedOut: false,
    };
    player.hasVoted = true;

    if (this.getSeatedPlayers(room).every((candidate) => candidate.hasVoted)) {
      this.resolveVoting(room);
    } else {
      this.broadcastState(room.id);
    }
    return ok();
  }

  private resolveVoting(room: GlitcherRoom) {
    if (!room.currentScene || !room.glitchUserId) return;

    const glitchUserIds = room.glitchUserIds ?? [room.glitchUserId];
    const glitchPlayers = glitchUserIds
      .map((id) => room.players.find((p) => p.userId === id))
      .filter((p): p is GlitcherPlayer => !!p);

    if (glitchPlayers.length === 0) {
      this.resetToLobby(room);
      this.broadcastState(room.id);
      return;
    }

    const totalPlayers = this.getSeatedPlayers(room).length;

    // Tally combined votes for all glitchers (treat all glitchers as one team)
    let glitchVoteTotal = 0;
    glitchUserIds.forEach((glitchId) => {
      Object.values(room.votes).forEach((vote) => {
        if (vote.targetUserId === glitchId) glitchVoteTotal++;
      });
    });

    // Win condition: combined glitch votes must be > half of total players
    const majority = totalPlayers / 2;
    let outcome: GlitcherOutcome;
    if (glitchVoteTotal > majority) {
      outcome = "NORMAL_WIN"; // Dân thắng
    } else if (glitchVoteTotal === majority) {
      outcome = "TIE"; // Hòa (chính xác nửa)
    } else {
      outcome = "GLITCH_WIN"; // Glitch thắng
    }

    const primaryGlitch = glitchPlayers[0];

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
      glitchUserId: primaryGlitch.userId,
      glitchPlayerName: primaryGlitch.name,
      glitchUserIds,
      glitchPlayerNames: glitchPlayers.map((p) => p.name),
      votes: this.getSeatedPlayers(room).map((player) => {
        const vote = room.votes[player.userId];
        const target = vote?.targetUserId
          ? room.players.find((c) => c.userId === vote.targetUserId)
          : undefined;
        return {
          voterUserId: player.userId,
          voterName: player.name,
          targetUserId: vote?.targetUserId ?? null,
          targetName: target?.name ?? null,
          timedOut: vote?.timedOut ?? false,
        };
      }),
      outcome,
      revealedAt: Date.now(),
    };

    room.latestReveal = reveal;
    room.state = "REVEAL";
    room.phaseId = randomUUID();
    this.broadcastState(room.id);
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
        !candidate.isSpectator &&
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
    this.clearReconnectGrace(room.id, player.userId);
    if (room.state !== "LOBBY" && !player.isSpectator && !player.isHost) {
      player.status = "disconnected";
      markConnectionAbandoned(player);
      socket.leave(room.id);
      delete socket.data.roomId;
      delete socket.data.userId;
      this.broadcastState(room.id);
      return ok("SEAT_ABANDONED");
    }

    if (room.state !== "LOBBY" && player.isHost) {
      this.resetToLobby(room);
    }

    room.players = room.players.filter(
      (candidate) => candidate.userId !== player.userId,
    );
    room.seatOrderUserIds = room.seatOrderUserIds.filter(
      (userId) => userId !== player.userId,
    );
    this.ensureHost(room);
    this.reindexPlayers(room);

    socket.leave(room.id);
    delete socket.data.roomId;
    delete socket.data.userId;

    if (room.players.length === 0) {
      this.deleteRoom(room.id);
      return ok();
    }

    this.broadcastState(room.id);
    return ok();
  }

  private resetToLobby(room: GlitcherRoom) {
    room.players = room.players.filter((p) => p.status === "connected" || !p.isSpectator);
    this.ensureHost(room);
    this.reindexPlayers(room);
    room.state = "LOBBY";
    room.seatOrderUserIds = [];
    room.currentScene = undefined;
    room.glitchUserId = undefined;
    room.glitchUserIds = undefined;
    room.questionRound = null;
    room.answerLog = [];
    room.votes = {};
    room.latestReveal = null;
    room.phaseId = randomUUID();
    room.players.forEach((player) => {
      player.isReady = false;
      player.hasConfirmedRole = false;
      player.hasVoted = false;
      delete player.assignment;
    });
  }

  private handleDisconnect(socket: Socket) {
    const room = this.getSocketRoom(socket);
    if (!room) return;
    const player = room.players.find((c) => c.id === socket.id);
    if (!player) return;

    player.status = "disconnected";
    markConnectionInterrupted(player);
    this.scheduleReconnectGrace(room, player);
    this.broadcastState(room.id);
  }

  private scheduleReconnectGrace(room: GlitcherRoom, player: GlitcherPlayer) {
    this.clearReconnectGrace(room.id, player.userId);
    const key = `${room.id}:${player.userId}`;
    const delay = Math.max(0, (player.reconnectDeadlineAt ?? Date.now()) - Date.now());
    const timer = setTimeout(() => {
      this.reconnectGraceTimers.delete(key);
      const currentRoom = this.rooms.get(room.id);
      const current = currentRoom?.players.find((candidate) => candidate.userId === player.userId);
      if (!currentRoom || !current || current.connectionState !== "temporarily_disconnected") return;
      markConnectionAbandoned(current);
      if (current.isHost) {
        current.isHost = false;
        this.ensureHost(currentRoom);
      }
      if (currentRoom.state === "LOBBY") {
        currentRoom.players = currentRoom.players.filter((candidate) => candidate.userId !== current.userId);
        this.reindexPlayers(currentRoom);
        if (currentRoom.players.length === 0) {
          this.scheduleEmptyRoomCleanup(currentRoom.id);
          return;
        }
      }
      this.broadcastState(currentRoom.id);
    }, delay);
    this.reconnectGraceTimers.set(key, timer);
  }

  private clearReconnectGrace(roomId: string, userId: string) {
    const key = `${roomId}:${userId}`;
    const timer = this.reconnectGraceTimers.get(key);
    if (timer) clearTimeout(timer);
    this.reconnectGraceTimers.delete(key);
  }

  private getSeatedPlayers(room: GlitcherRoom) {
    return room.players.filter((player) => !player.isSpectator);
  }

  private ensureHost(room: GlitcherRoom) {
    if (room.players.length === 0) return;
    const host = room.players.find((player) => player.isHost && !player.isSpectator);
    if (host) return;
    const nextHost = room.players.find(
      (player) => player.status === "connected" && !player.isSpectator,
    );
    if (nextHost) nextHost.isHost = true;
  }

  private reindexPlayers(room: GlitcherRoom) {
    let seatIndex = 0;
    room.players.forEach((player) => {
      player.seatIndex = player.isSpectator ? -1 : seatIndex++;
    });
  }

  private scheduleEmptyRoomCleanup(roomId: string) {
    this.clearEmptyRoomCleanup(roomId);
    const timer = setTimeout(() => {
      this.emptyRoomCleanupTimers.delete(roomId);
      const room = this.rooms.get(roomId);
      if (!room) return;
      if (room.players.some((player) => player.status === "connected")) {
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
    this.clearEmptyRoomCleanup(roomId);
    for (const [key, timer] of this.reconnectGraceTimers) {
      if (key.startsWith(`${roomId}:`)) {
        clearTimeout(timer);
        this.reconnectGraceTimers.delete(key);
      }
    }
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
    const sceneIsVisible = room.state !== "LOBBY";
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
      };
    }

    const publicPlayers: GlitcherPublicPlayer[] = room.players.map(
      (player) => ({
        userId: player.userId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        seatIndex: player.seatIndex,
        isHost: player.isHost,
        isSpectator: player.isSpectator,
        status: player.status,
        isReady: player.isReady,
        hasConfirmedRole: player.hasConfirmedRole,
        hasVoted: player.hasVoted,
      }),
    );

    return {
      roomId: room.id,
      state: room.state,
      settings: { ...room.settings },
      timing: { ...room.timing },
      players: publicPlayers,
      viewerUserId: viewer?.userId ?? null,
      selectedSceneIndex: room.selectedSceneIndex,
      totalAvailableScenes: room.totalAvailableScenes,
      sceneNumber: room.sceneNumber,
      phaseId: room.phaseId,
      questions,
      privateCard,
      questionRound: room.questionRound,
      answerLog: room.answerLog,
      voteProgress:
        room.state === "DISCUSSION"
          ? {
              submitted: this.getSeatedPlayers(room).filter((player) => player.hasVoted).length,
              required: this.getSeatedPlayers(room).length,
            }
          : null,
      latestReveal: room.state === "REVEAL" ? room.latestReveal : null,
    };
  }
}
