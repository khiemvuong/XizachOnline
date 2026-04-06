export type AvalonRole = 'Arthur' | 'Merlin' | 'Percival' | 'Mordred' | 'Assassin' | 'Morgana' | 'Oberon' | 'Good Lancelot' | 'Evil Lancelot' | 'Minion_Good' | 'Minion_Evil';
export type AvalonTeam = 'Good' | 'Evil';
export type AvalonGameState = 'LOBBY' | 'ROLE_REVEAL' | 'TEAM_BUILDING' | 'VOTING' | 'QUEST' | 'ASSASSINATION' | 'GAME_OVER';

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
  isReady?: boolean;
  isSpectator?: boolean;
  // UI states
  hasVoted?: boolean;
  currentVote?: 'approve' | 'reject';
  questVote?: 'success' | 'fail';
}

export interface AvalonRoom {
  id: string;
  players: AvalonPlayer[];
  state: AvalonGameState;
  settings: {
    merlin: boolean;
    percival: boolean;
    assassin: boolean;
    morgana: boolean;
    mordred: boolean;
    oberon: boolean;
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
  earlyEndVotes?: string[]; // userIds of players who have voted to end game early
  voteOutcome?: AvalonVoteOutcome | null;
  questParticipantsHistory: AvalonQuestParticipantsRecord[];
}
