export type DeceptionRole =
  | "ForensicScientist"
  | "Murderer"
  | "Accomplice"
  | "Witness"
  | "Investigator";

export type DeceptionTeam = "Investigator" | "Murderer";

export type DeceptionGameState =
  | "LOBBY"
  | "ROLE_REVEAL"
  | "NIGHT_PHASE"
  | "SCENE_SETUP"
  | "DISCUSSION"
  | "SOLVING_ATTEMPT"
  | "WITNESS_HUNT"
  | "GAME_OVER";

export interface MeansCard {
  id: number;
  english: string;
  vietnamese: string;
  description: string;
  group?: string;
  imageUrl?: string;
}

export interface ClueCard {
  id: number;
  english: string;
  vietnamese: string;
  description: string;
  group?: string;
  imageUrl?: string;
}

export interface SceneTileOption {
  text: string;
  textVi: string;
}

export interface SceneTile {
  id: string;
  name: string;
  nameVi: string;
  type: "mandatory_purple" | "mandatory_green" | "evidence_brown";
  options: SceneTileOption[];
  markerIndex: number | null;
}

export interface SolvingAttempt {
  id: string;
  investigatorUserId: string;
  investigatorName: string;
  accusedUserId: string;
  accusedName: string;
  selectedMeansId: number;
  selectedClueId: number;
  result: "pending" | "correct" | "incorrect";
  timestamp: number;
}

export interface SolvingResolutionNotice {
  result: "correct" | "incorrect";
  investigatorName: string;
  accusedName: string;
  timestamp: number;
}

export interface DeceptionPlayer {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  role?: DeceptionRole;
  team?: DeceptionTeam;
  isHost: boolean;
  status: "connected" | "disconnected";
  isSpectator?: boolean;
  isReady?: boolean;
  meansCards: MeansCard[];
  clueCards: ClueCard[];
  hasBadge: boolean;
  isHandRaised?: boolean;
  isMurdererHint?: boolean;
}

export interface DeceptionSettings {
  enableAccomplice: boolean;
  enableWitness: boolean;
  discussionTimeSeconds: number;
  meansCardsPerPlayer: number;
  clueCardsPerPlayer: number;
  /** "easy" = bộ thẻ cụ thể dễ suy luận; "hard" = bộ gốc bản board game */
  sceneDifficulty: "easy" | "hard";
}

export interface DeceptionChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface MurderSelection {
  meansId: number;
  clueId: number;
}

export interface DeceptionRoom {
  id: string;
  players: DeceptionPlayer[];
  state: DeceptionGameState;
  settings: DeceptionSettings;
  messages: DeceptionChatMessage[];

  // Night phase — murderer's secret selection
  murderSelection: MurderSelection | null;

  // Scene board
  activeSceneTiles: SceneTile[];
  scenePool: SceneTile[];
  replacedTileIndex: number | null;
  awaitingReplacementChoice: boolean;

  // Rounds
  currentRound: number;

  // Timer — null means not started; timestamp of when it ends
  timerEndAt: number | null;
  timerPausedRemaining: number | null;

  // Solving
  solvingAttempts: SolvingAttempt[];
  activeSolvingAttempt: SolvingAttempt | null;
  solvingResolutionNotice: SolvingResolutionNotice | null;

  // Results
  winner?: "Investigator" | "Murderer" | "Abandoned";
  witnessHuntTarget?: string;
  witnessHuntResult?: "correct" | "incorrect";
  
  lastForensicScientistUserId?: string | null;
  witnessCycleUserIds?: string[];

  /**
   * Tracks murder-quota for players whose normalised name contains "thao" or equals "chu".
   * Key = userId, value = { gamesPlayed, murdererCount }.
   * Ensures on average 1 Murderer assignment per 3 games.
   */
  murdererQuotaMap?: Record<string, { gamesPlayed: number; murdererCount: number }>;
}
