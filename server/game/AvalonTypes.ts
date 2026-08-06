export type AvalonRole = 'Arthur' | 'Merlin' | 'Percival' | 'Mordred' | 'Assassin' | 'Morgana' | 'Oberon' | 'Athena' | 'Good Lancelot' | 'Evil Lancelot' | 'Minion_Good' | 'Minion_Evil';
export type AvalonTeam = 'Good' | 'Evil';
export type AvalonGameState = 'LOBBY' | 'ROLE_REVEAL' | 'TEAM_BUILDING' | 'VOTING' | 'SKILL_DECISION' | 'QUEST' | 'QUEST_RESOLUTION' | 'ASSASSINATION' | 'GAME_OVER';

export type AvalonSkillType =
  | 'none'
  | 'merlinEternalBond'
  | 'assassinInsight'
  | 'morganaSilence'
  | 'mordredForceFail'
  | 'athenaFateFlip'
  | 'percivalTrace'
  | 'minionChaCha';

export type AvalonSkillDecision = {
  userId: string;
  skillType: AvalonSkillType;
  useSkill: boolean;
  targetUserId?: string | null;
  submittedAt: number;
};

export type AvalonSkillUsagePhase = 'quest' | 'preAssassination';

export type AvalonSkillUsageLog = {
  id: string;
  phase: AvalonSkillUsagePhase;
  questNumber: number | null;
  actorUserId: string;
  actorName: string;
  skillType: AvalonSkillType;
  targetUserId?: string | null;
  targetName?: string | null;
  detail?: string;
  createdAt: number;
};

export type AvalonForcedFailState = {
  questNumber: number;
  targetUserId: string;
  sourceUserId: string;
};

export type AvalonSkillDecisionState = {
  questNumber: number;
  phase: 'quest' | 'preAssassination';
  participantUserIds: string[];
  decisions: Record<string, AvalonSkillDecision>;
  submittedCount: number;
  publicAnnouncements: string[];
  morganaSilenced?: boolean;
  athenaActivatorUserId?: string;
  mordredForceTargetUserId?: string;
  successfulChaChaUserIds?: string[];
};

export type AvalonVoteOutcome = {
  id: number;
  kind: 'team' | 'quest';
  result: 'approve' | 'reject' | 'success' | 'fail';
  leaderUserId: string;
  revealDetailedCountsToLeader: boolean;
  approveCount?: number;
  rejectCount?: number;
  successCount?: number;
  failCount?: number;
  totalVotes?: number;
  questNumber?: number;
  athenaFlip?: boolean;
  athenaStage?: 'raw' | 'flipped';
  athenaRawResult?: 'success' | 'fail';
  athenaFinalResult?: 'success' | 'fail';
  announcement?: string;
  createdAt: number;
};

export type AvalonQuestParticipantsRecord = {
  questNumber: number;
  participantUserIds: string[];
};

export interface AvalonPlayer {
  id: string; // socket id
  userId: string;
  name: string;
  avatarUrl?: string;
  role?: AvalonRole;
  team?: AvalonTeam;
  isHost: boolean;
  status: 'connected' | 'disconnected';
  reconnectTokenHash?: string;
  connectionState?: 'connected' | 'temporarily_disconnected' | 'abandoned';
  disconnectedAt?: number;
  reconnectDeadlineAt?: number;
  isReady?: boolean;
  isSpectator?: boolean;
  // UI states
  hasVoted?: boolean;
  currentVote?: 'approve' | 'reject';
  questVote?: 'success' | 'fail';
  isHandRaised?: boolean;
}

export interface AvalonRoom {
  id: string;
  players: AvalonPlayer[];
  state: AvalonGameState;
  timing: RoomTimingConfig<
    "roleReveal" | "teamVote" | "skillDecision" | "questVote" | "assassination"
  >;
  settings: {
    advancedMode: boolean;
    merlin: boolean;
    percival: boolean;
    assassin: boolean;
    morgana: boolean;
    mordred: boolean;
    oberon: boolean;
    athena?: boolean;
    leaderSeesDetailedVoteCounts: boolean;
    showQuestParticipantsBoard: boolean;
    lancelotMode?: boolean;
  };
  messages: { senderId: string, senderName: string, text: string, timestamp: number }[];
  
  // Game progression
  questHistory: { teamSize: number, failsRequired: number, status: 'success' | 'fail' | 'pending', votes?: ('success' | 'fail')[] }[]; // Typically 5 quests
  currentQuestIndex: number; // 0 to 4
  voteTrack: number; // 0 to 4 (If reaches 5, the Evil team wins the game, or simply auto-fails the quest depending on typical custom rules. Actually rule: if 5 teams rejected in a row for a single quest, evil wins immediately)
  
  // Turn state
  leaderIndex: number;
  proposedTeam: string[]; // List of userIds chosen by the leader
  votingResults: Record<string, 'approve' | 'reject'> | null; // userId -> vote
  winner?: 'Good' | 'Evil' | 'Abandoned';
  assassinationTarget?: string;
  assassinationSuggestions?: Record<string, string | null>; // userId (Evil) -> suggested targetId
  earlyEndVotes?: string[]; // userIds of players who have voted to end game early
  voteOutcome?: AvalonVoteOutcome | null;
  questParticipantsHistory: AvalonQuestParticipantsRecord[];
  skillDecisionState?: AvalonSkillDecisionState | null;
  skillUsedByUserId?: Record<string, boolean>;
  skillUsageHistory?: AvalonSkillUsageLog[];
  functionTagByViewerUserId?: Record<string, Record<string, 'hasFunction' | 'noFunction'>>;
  privateFunctionTagByTargetUserId?: Record<string, 'hasFunction' | 'noFunction'>;
  merlinBondArmedUserId?: string | null;
  forcedFailState?: AvalonForcedFailState | null;
  privateNoticesByUserId?: Record<string, string[]>;
  privateNotices?: string[];
  publicRevealedRoleUserIds?: string[];
  minionSoulmates?: string[];
}
import type { RoomTimingConfig } from "./shared/timing";
