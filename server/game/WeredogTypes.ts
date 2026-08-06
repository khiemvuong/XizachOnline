export type WeredogRole =
  | 'Wolf'        // Sói
  | 'Bodyguard'   // Chó bảo vệ
  | 'Seer'        // Chó tiên tri
  | 'Hunter'      // Chó thợ săn
  | 'Cupid'       // Chó cupid
  | 'Witch'       // Chó phù thủy
  | 'Elder'       // Chó già làng
  | 'Villager';   // Chó bình thường (Dân)

export type WeredogTeam = 'Wolf' | 'Villager' | 'ThirdParty';

export interface RoleConfig {
  role: WeredogRole;
  nameVi: string;
  team: WeredogTeam;
  nightPriority: number; // Order of action at night. Lower priority number acts first.
  description: string;
}

export const ROLE_CONFIGS: Record<WeredogRole, RoleConfig> = {
  Cupid: {
    role: 'Cupid',
    nameVi: 'Chó Cupid',
    team: 'Villager',
    nightPriority: 10, // First night only
    description: 'Ghép đôi 2 người chơi thành tình nhân ở đêm đầu tiên.',
  },
  Bodyguard: {
    role: 'Bodyguard',
    nameVi: 'Chó Bảo Vệ',
    team: 'Villager',
    nightPriority: 20,
    description: 'Bảo vệ 1 người mỗi đêm khỏi bị sói cắn. Không được chọn 1 người 2 đêm liên tiếp.',
  },
  Wolf: {
    role: 'Wolf',
    nameVi: 'Chó Sói',
    team: 'Wolf',
    nightPriority: 30,
    description: 'Cùng bầy sói vote cắn 1 người mỗi đêm.',
  },
  Seer: {
    role: 'Seer',
    nameVi: 'Chó Tiên Tri',
    team: 'Villager',
    nightPriority: 40,
    description: 'Soi 1 người chơi để biết họ là Sói hay Người.',
  },
  Witch: {
    role: 'Witch',
    nameVi: 'Chó Phù Thủy',
    team: 'Villager',
    nightPriority: 50,
    description: 'Sở hữu 1 bình cứu và 1 bình giết. Chỉ được dùng tối đa 1 bình mỗi đêm.',
  },
  Hunter: {
    role: 'Hunter',
    nameVi: 'Chó Thợ Săn',
    team: 'Villager',
    nightPriority: 60,
    description: 'Ngắm bắn 1 người mỗi đêm. Nếu chết, mục tiêu ngắm bắn sẽ chết theo.',
  },
  Elder: {
    role: 'Elder',
    nameVi: 'Chó Già Làng',
    team: 'Villager',
    nightPriority: 99, // Doesn't wake up to act, but defined for configuration
    description: 'Có 2 mạng chống sói cắn. Nếu chết, toàn bộ dân thường mất chức năng.',
  },
  Villager: {
    role: 'Villager',
    nameVi: 'Chó Bình Thường',
    team: 'Villager',
    nightPriority: 100, // No night action
    description: 'Dân thường bình dị, thảo luận vote treo cổ tìm sói ban ngày.',
  },
};

export type WeredogGameState =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT_ACTION'
  | 'DAY_START'
  | 'DAY_VOTING'
  | 'GAME_OVER';

export interface WeredogPlayer {
  id: string; // Socket ID
  userId: string; // Persistent browser ID
  name: string;
  avatarUrl?: string;
  role?: WeredogRole;
  isHost: boolean; // room ownership and lobby authority
  isModerator: boolean; // non-playing game-master authority
  isSpectator: boolean;
  isReady: boolean;
  status: 'connected' | 'disconnected';
  reconnectTokenHash?: string;
  connectionState?: 'connected' | 'temporarily_disconnected' | 'abandoned';
  disconnectedAt?: number;
  reconnectDeadlineAt?: number;

  // Gameplay status
  isAlive: boolean;
  protectedLastNightUserId?: string; // Bodyguard tracking
  witchHasSaveBottle: boolean; // Witch save status
  witchHasKillBottle: boolean; // Witch kill status
  elderLives: number; // Elder extra lives (default 2)
  isLover: boolean; // Cupid pairing status
  loverUserId?: string; // Cupid partner ID
  hasVoted?: boolean;
  voteWeight?: number;
}

export interface WeredogChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface WeredogHistoryRecord {
  nightNumber: number;
  wolfVictimUserId?: string | null; // target chosen by wolves
  bodyguardTargetUserId?: string | null;
  seerTargetUserId?: string | null;
  seerResult?: 'Wolf' | 'Human' | null;
  witchAction?: 'save' | 'kill' | 'none' | null;
  witchTargetUserId?: string | null;
  hunterShotTargetUserId?: string | null;
  cupidLovers?: string[] | null; // [userId1, userId2] (Night 1 only)
}

export interface WeredogRoom {
  id: string;
  players: WeredogPlayer[];
  playerMap?: Map<string, WeredogPlayer>; // Cache for O(1) lookups by userId
  state: WeredogGameState;
  timing: RoomTimingConfig<
    "roleReveal" | "wolfVote" | "bodyguard" | "seer" | "cupid" | "witch" | "dayVote"
  >;
  settings: {
    wolfCount: number;
    enabledRoles: WeredogRole[]; // Witch, Seer, etc.
  };
  messages: WeredogChatMessage[];
  messageStartIndex: number; // For circular message buffer (Phase 2)

  // Performance caches 
  _alivePlayersCache?: WeredogPlayer[]; // Cached alive players
  _aliveCacheInvalidated?: boolean; // Cache validity flag

  // Game tracking
  nightNumber: number;
  currentNightActiveRole?: WeredogRole; // Role currently acting
  activeNightRolesOrder: WeredogRole[]; // Order of roles acting tonight
  currentNightRoleIndex: number; // Index in activeNightRolesOrder

  // Night State
  wolfVotes: Record<string, string>; // wolfUserId -> targetUserId
  wolfVictimUserId?: string | null; // final chosen wolf target (before witch/bodyguard calculations)
  bodyguardTargetUserId?: string | null;
  seerTargetUserId?: string | null;
  seerResult?: 'Wolf' | 'Human' | null;
  witchActionSelected?: 'save' | 'kill' | 'none'; // temporary selection before target is picked
  witchTargetUserId?: string | null;
  pendingHunterShotUserId?: string | null;
  hunterShotTargetUserId?: string | null;
  dayStartNextAction?: 'vote' | 'night';
  cupidLoverUserIds?: string[]; // [userId1, userId2]
  cupidLoversConfirmed?: boolean;

  // Day State
  deathsThisNight: string[]; // List of userIds of players who died tonight
  dayVotes: Record<string, string | 'skip'>; // voterUserId -> votedUserId | 'skip'
  tiebreakerActive: boolean; // true if there was a tie and host is deciding
  tiebreakerCandidates: string[]; // candidate userIds in case of tie
  
  // History logs
  history: WeredogHistoryRecord[];
  winner?: 'Villager' | 'Wolf' | 'Cupid' | 'Abandoned';
  wolfParityPending?: boolean;
  wolfParityAcknowledgedKey?: string;
  isElderDead?: boolean;
}
import type { RoomTimingConfig } from "./shared/timing";
