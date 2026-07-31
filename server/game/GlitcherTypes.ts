export type GlitcherGameState =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "PERFORMANCE_AND_QUESTIONS"
  | "DISCUSSION"
  | "VOTING"
  | "REVEAL";

export type GlitcherOutcome = "GLITCH_WIN" | "NORMAL_WIN" | "TIE";

export type GlitcherPlayerStatus = "connected" | "disconnected";
export type GlitcherQuestionStage = "SELECTING" | "ANSWERING";
export type GlitcherAnswerMap = Record<string, boolean>;

export const GLITCHER_NAMESPACE = "/glitcher" as const;

export const GLITCHER_CLIENT_EVENTS = {
  checkRoom: "checkRoom",
  createRoom: "createRoom",
  joinRoom: "joinRoom",
  selectScene: "selectScene",
  toggleReady: "toggleReady",
  startTour: "startTour",
  confirmRole: "confirmRole",
  selectQuestion: "selectQuestion",
  answerQuestion: "answerQuestion",
  submitVote: "submitVote",
  returnToLobby: "returnToLobby",
  explicitLeave: "explicitLeave",
  transferHost: "transferHost",
  changeName: "changeName",
  measurePing: "measurePing",
  updatePing: "updatePing",
} as const;

export const GLITCHER_SERVER_EVENTS = {
  stateUpdate: "stateUpdate",
  error: "glitcherError",
  playerPing: "playerPing",
} as const;

export interface GlitcherGameMetadata {
  id: string;
  title: string;
  version: string;
  language: string;
}

export interface GlitcherQuestion {
  id: string;
  text: string;
}

export interface GlitcherRole {
  id: string;
  name: string;
  action: string;
  answers?: GlitcherAnswerMap;
}

export interface GlitcherGlitchRole extends GlitcherRole {
  shadow_role_id: string;
}

export interface GlitcherSceneSummary {
  title: string;
  description: string;
}

export interface GlitcherGlitchScene extends GlitcherSceneSummary {
  roles: GlitcherGlitchRole[];
}

export interface GlitcherScene extends GlitcherSceneSummary {
  id: string;
  slug: string;
  questions: GlitcherQuestion[];
  roles: GlitcherRole[];
  glitch_scene: GlitcherGlitchScene;
}

export interface GlitcherGameData {
  game: GlitcherGameMetadata;
  scenes: GlitcherScene[];
}

export interface GlitcherSettings {
  minPlayers: 6;
  maxPlayers: 12;
  scenesPerTour: 4;
}

export interface GlitcherAssignment {
  sceneId: string;
  role: GlitcherRole | GlitcherGlitchRole;
  isGlitch: boolean;
}

export interface GlitcherPlayer {
  /** Current Socket.IO socket id. Never exposed in GlitcherClientState. */
  id: string;
  /** Persistent browser identity used to reclaim a seat after reconnecting. */
  userId: string;
  /** Secret capability required to bind a new socket to this persistent seat. */
  reconnectToken: string;
  name: string;
  avatarUrl?: string;
  seatIndex: number;
  isHost: boolean;
  status: GlitcherPlayerStatus;
  isReady: boolean;
  hasConfirmedRole: boolean;
  hasVoted: boolean;
  assignment?: GlitcherAssignment;
}

export interface GlitcherAnswerLogEntry {
  id: string;
  targetUserId: string;
  targetName: string;
  questionerUserId: string;
  questionerName: string;
  questionText: string;
  answer: boolean; // true = CÓ, false = KHÔNG
}

export interface GlitcherQuestionRound {
  targetUserId: string;
  performerIndex: number;
  totalPerformers: number;
  questionerUserIds: string[];
  currentQuestionerUserId: string | null;
  turnIndex: number; // 0, 1, 2 (up to 3 questions per target)
  stage: GlitcherQuestionStage;
  selectedQuestionId: string | null;
  usedQuestionIds: string[];
}

export interface GlitcherVoteRecord {
  voterUserId: string;
  targetUserId: string | null;
  submittedAt: number | null;
  timedOut: boolean;
}

export interface GlitcherRevealedVote {
  voterUserId: string;
  voterName: string;
  targetUserId: string | null;
  targetName: string | null;
  timedOut: boolean;
}

export interface GlitcherSceneReveal {
  sceneNumber: number;
  trueScene: GlitcherSceneSummary;
  glitchScene: GlitcherSceneSummary;
  glitchUserId: string;
  glitchPlayerName: string;
  votes: GlitcherRevealedVote[];
  outcome: GlitcherOutcome;
  revealedAt: number;
}

export interface GlitcherRoom {
  id: string;
  players: GlitcherPlayer[];
  state: GlitcherGameState;
  settings: GlitcherSettings;

  selectedSceneIndex: number | null; // null = random
  totalAvailableScenes: number;
  sceneNumber: number;
  seatOrderUserIds: string[];
  usedSceneIds: string[];

  phaseId: string;
  currentScene?: GlitcherScene;
  glitchUserId?: string;
  questionRound: GlitcherQuestionRound | null;
  answerLog: GlitcherAnswerLogEntry[];
  votes: Record<string, GlitcherVoteRecord>;
  latestReveal: GlitcherSceneReveal | null;

  /** userId + actionId keys, insertion ordered and bounded by the engine. */
  processedActionIds: Map<
    string,
    {
      processedAt: number;
      ack: GlitcherActionAck;
    }
  >;
}

export interface GlitcherPublicQuestion {
  id: string;
  text: string;
}

export interface GlitcherPublicPlayer {
  userId: string;
  name: string;
  avatarUrl?: string;
  seatIndex: number;
  isHost: boolean;
  status: GlitcherPlayerStatus;
  isReady: boolean;
  hasConfirmedRole: boolean;
  hasVoted: boolean;
}

export interface GlitcherPrivateCard {
  scene: GlitcherSceneSummary;
  role: {
    name: string;
    action: string;
  };
}

export interface GlitcherVoteProgress {
  submitted: number;
  required: number;
}

export interface GlitcherClientState {
  roomId: string;
  state: GlitcherGameState;
  settings: GlitcherSettings;
  players: GlitcherPublicPlayer[];
  viewerUserId: string | null;
  reconnectToken: string | null;

  selectedSceneIndex: number | null;
  totalAvailableScenes: number;
  sceneNumber: number;

  phaseId: string;

  questions: GlitcherPublicQuestion[];
  privateCard: GlitcherPrivateCard | null;
  questionRound: GlitcherQuestionRound | null;
  answerLog: GlitcherAnswerLogEntry[];
  voteProgress: GlitcherVoteProgress | null;
  latestReveal: GlitcherSceneReveal | null;
}

export interface GlitcherActionPayload {
  actionId: string;
}

export interface GlitcherSelectScenePayload extends GlitcherActionPayload {
  sceneIndex: number | null;
}

export interface GlitcherSelectQuestionPayload extends GlitcherActionPayload {
  questionId: string;
}

export interface GlitcherAnswerQuestionPayload extends GlitcherActionPayload {
  answer: boolean;
}

export interface GlitcherSubmitVotePayload extends GlitcherActionPayload {
  targetUserId: string;
}

export interface GlitcherTransferHostPayload extends GlitcherActionPayload {
  targetUserId: string;
}

export interface GlitcherJoinRoomPayload {
  roomId: string;
  playerName: string;
  userId: string;
  avatarUrl?: string;
  reconnectToken?: string;
}

export interface GlitcherActionAck {
  ok: boolean;
  code?: string;
  message?: string;
}

export interface GlitcherClientToServerEvents {
  checkRoom: (roomId: string, callback: (exists: boolean) => void) => void;
  createRoom: (roomId: string, callback: (created: boolean) => void) => void;
  joinRoom: (payload: GlitcherJoinRoomPayload) => void;
  selectScene: (
    payload: GlitcherSelectScenePayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  toggleReady: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  startTour: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  confirmRole: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  selectQuestion: (
    payload: GlitcherSelectQuestionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  answerQuestion: (
    payload: GlitcherAnswerQuestionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  submitVote: (
    payload: GlitcherSubmitVotePayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  returnToLobby: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  explicitLeave: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  transferHost: (
    payload: GlitcherTransferHostPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  changeName: (newName: string) => void;
  measurePing: (
    timestamp: number,
    callback: (timestamp: number) => void,
  ) => void;
  updatePing: (userId: string, ping: number) => void;
}

export interface GlitcherServerToClientEvents {
  stateUpdate: (state: GlitcherClientState) => void;
  glitcherError: (message: string) => void;
  playerPing: (userId: string, ping: number) => void;
}

export interface GlitcherSocketData {
  roomId?: string;
  userId?: string;
}
