export type GlitcherGameState =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "QUESTION_ROUND"
  | "PERFORMANCE_SETUP"
  | "PERFORMANCE"
  | "DISCUSSION"
  | "VOTING"
  | "REVEAL"
  | "TOUR_SUMMARY";

export type GlitcherPlayerStatus = "connected" | "disconnected";
export type GlitcherQuestionStage = "SELECTING" | "ANSWERING";
export type GlitcherAnswerMap = Record<string, boolean>;

export const GLITCHER_NAMESPACE = "/glitcher" as const;

export const GLITCHER_CLIENT_EVENTS = {
  checkRoom: "checkRoom",
  createRoom: "createRoom",
  joinRoom: "joinRoom",
  toggleReady: "toggleReady",
  startTour: "startTour",
  confirmRole: "confirmRole",
  selectQuestion: "selectQuestion",
  completeQuestion: "completeQuestion",
  submitVote: "submitVote",
  nextScene: "nextScene",
  restartTour: "restartTour",
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
  answers: GlitcherAnswerMap;
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
  roleRevealSeconds: 75;
  questionSelectionSeconds: 30;
  questionAnswerSeconds: 12;
  performanceSetupSeconds: 15;
  performanceSeconds: 45;
  votingSeconds: 60;
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
  totalScore: number;
  sceneScore: number;
  assignment?: GlitcherAssignment;
}

export interface GlitcherQuestionRound {
  questionerUserIds: string[];
  currentQuestionerUserId: string | null;
  turnIndex: number;
  stage: GlitcherQuestionStage;
  selectedQuestionId: string | null;
  usedQuestionIds: string[];
  completedTurns: number;
  /** Set only while the active questioner's timer is paused for reconnect. */
  pausedForUserId: string | null;
  reconnectGraceDeadlineAt: number | null;
  /** Internal/public countdown snapshot; does not contain secret game data. */
  pausedQuestionRemainingMs: number | null;
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

export interface GlitcherScoreDelta {
  userId: string;
  playerName: string;
  delta: number;
}

export interface GlitcherSceneReveal {
  sceneNumber: number;
  trueScene: GlitcherSceneSummary;
  glitchScene: GlitcherSceneSummary;
  glitchUserId: string;
  glitchPlayerName: string;
  votes: GlitcherRevealedVote[];
  scores: GlitcherScoreDelta[];
  revealedAt: number;
}

export interface GlitcherRankedPlayer {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  totalScore: number;
}

export interface GlitcherTourSummary {
  tourNumber: number;
  rankedPlayers: GlitcherRankedPlayer[];
  winnerUserIds: string[];
}

export interface GlitcherRoom {
  id: string;
  players: GlitcherPlayer[];
  state: GlitcherGameState;
  settings: GlitcherSettings;

  tourNumber: number;
  sceneNumber: number;
  seatOrderUserIds: string[];
  /** Index of the next questioner. It intentionally survives tour/lobby resets. */
  questionCursor: number;
  sceneDeckIds: string[];
  usedSceneIds: string[];

  phaseId: string;
  phaseStartedAt: number | null;
  phaseDeadlineAt: number | null;

  currentScene?: GlitcherScene;
  glitchUserId?: string;
  questionRound: GlitcherQuestionRound | null;
  votes: Record<string, GlitcherVoteRecord>;
  sceneResults: GlitcherSceneReveal[];
  latestReveal: GlitcherSceneReveal | null;
  tourSummary: GlitcherTourSummary | null;

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

/**
 * The same payload shape is used for a real-scene role and a glitch-scene role.
 * Deliberately absent: role id, scene id/slug, shadow_role_id and isGlitch.
 */
export interface GlitcherPrivateCard {
  scene: GlitcherSceneSummary;
  role: {
    name: string;
    action: string;
  };
  /**
   * Five answers in the exact order of GlitcherClientState.questions.
   * Question ids are intentionally absent from the private card.
   */
  answers: boolean[];
}

export interface GlitcherVoteProgress {
  submitted: number;
  required: number;
}

/**
 * Allowlisted, viewer-specific wire DTO. Never replace this with GlitcherRoom or
 * a JSON clone of GlitcherRoom: the internal room contains secret assignments.
 */
export interface GlitcherClientState {
  roomId: string;
  state: GlitcherGameState;
  settings: GlitcherSettings;
  players: GlitcherPublicPlayer[];
  viewerUserId: string | null;
  /** Viewer-only seat capability. Persist per room and send on reconnect. */
  reconnectToken: string | null;

  tourNumber: number;
  sceneNumber: number;
  totalScenes: number;
  discussionSeconds: number;

  phaseId: string;
  phaseStartedAt: number | null;
  phaseDeadlineAt: number | null;

  questions: GlitcherPublicQuestion[];
  privateCard: GlitcherPrivateCard | null;
  questionRound: GlitcherQuestionRound | null;
  voteProgress: GlitcherVoteProgress | null;
  latestReveal: GlitcherSceneReveal | null;
  tourSummary: GlitcherTourSummary | null;
}

export interface GlitcherActionPayload {
  actionId: string;
}

export interface GlitcherSelectQuestionPayload extends GlitcherActionPayload {
  questionId: string;
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
  completeQuestion: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  submitVote: (
    payload: GlitcherSubmitVotePayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  nextScene: (
    payload: GlitcherActionPayload,
    callback?: (ack: GlitcherActionAck) => void,
  ) => void;
  restartTour: (
    payload: GlitcherActionPayload,
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
