export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GameState = 'IDLE' | 'DEALING' | 'PLAYER_TURN' | 'BANKER_TURN' | 'GAME_OVER';

export interface Player {
  id: string; // socket id
  userId: string; // persistent browser id
  name: string;
  avatarUrl?: string;
  peerId?: string;
  cards: Card[];
  revealedCardIndexes: number[];
  isBanker: boolean;
  isReady: boolean;
  isSpectator: boolean;
  status: 'playing' | 'busted' | 'stay' | 'win' | 'lose' | 'draw' | 'waiting' | 'disconnected';
  isMicOn?: boolean;
  isSpeaking?: boolean;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface PeekRequest {
  fromUserId: string;
  fromPlayerName: string;
  toUserId: string;
  requestId: string; // unique id để track request
  timestamp: number;
}

export interface Room {
  id: string;
  players: Player[];
  state: GameState;
  deck: Card[];
  currentPlayerIndex: number; // whose turn it is
  messages: ChatMessage[];
  peekRequests: PeekRequest[]; // pending peek requests
  peekApprovals: Set<string>; // track approved peeks: "fromUserId|toUserId"
  pendingBankerUserId?: string;
}
