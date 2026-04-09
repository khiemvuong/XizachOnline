import { Room, Player } from './Types';
import { Deck } from './Deck';
import { calculatePoints } from './Rules';
import { Server, Socket } from 'socket.io';

export class GameEngine {
  private rooms: Map<string, Room> = new Map();
  private io: Server;
  private chatRateLimits: Map<string, number[]> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: [],
        state: 'IDLE',
        deck: [],
        currentPlayerIndex: -1,
        messages: [],
        peekRequests: [],
        peekApprovals: new Set(),
        pendingBankerUserId: undefined
      });
    }
  }

  joinRoom(roomId: string, pData: Omit<Player, 'cards' | 'revealedCardIndexes' | 'isBanker' | 'isReady' | 'isSpectator' | 'status'>, socket: Socket) {
    this.createRoom(roomId);
    const room = this.rooms.get(roomId)!;
    
    const existingPlayer = room.players.find(p => p.userId === pData.userId);
    if (existingPlayer) {
      // Reconnect logic
      existingPlayer.id = pData.id;
      if (pData.peerId) existingPlayer.peerId = pData.peerId;
      existingPlayer.name = pData.name; // maybe they changed name
      
      // If they were disconnected, restore them
      if (existingPlayer.status === 'disconnected') {
        if (room.state === 'IDLE') {
          existingPlayer.status = existingPlayer.isSpectator ? 'waiting' : 'playing';
        } else {
           // mid game recovery - if they have cards they are still 'playing' in context of game, unless 'stay' or 'busted'
           if (existingPlayer.cards.length === 0) existingPlayer.status = 'waiting';
           else {
             // restore whatever status makes sense or leave as is (which was 'disconnected')
             // For safety let's put them on 'stay' if it's not their turn 
             // but 'playing' if they are mid-game without busted.
             const { isBusted } = calculatePoints(existingPlayer.cards);
             existingPlayer.status = isBusted ? 'busted' : 'playing';
           }
        }
      }
    } else {
      // Brand new player
      const hasBanker = room.players.some(p => p.isBanker);
      const isBanker = !hasBanker && room.players.length === 0;
      
      // Spectator by default if joining mid-game or intentionally
      const isSpectator = room.state !== 'IDLE';

      room.players.push({
        ...pData,
        cards: [],
        revealedCardIndexes: [],
        isBanker,
        isReady: false,
        isSpectator,
        status: isSpectator ? 'waiting' : 'playing'
      });
    }

    socket.join(roomId);
    this.broadcastState(roomId);
  }

  chatMessage(roomId: string, senderId: string, text: string) {
    if (!text || text.length > 500) return;

    const now = Date.now();
    let userStamps = this.chatRateLimits.get(senderId) || [];
    userStamps = userStamps.filter(time => now - time < 10000);

    if (userStamps.length >= 10) return; // Rate limit exceeded: max 10 messages per 10s

    userStamps.push(now);
    this.chatRateLimits.set(senderId, userStamps);

    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.userId === senderId);
    if (player) {
      room.messages.push({
        senderId: player.userId,
        senderName: player.name,
        text,
        timestamp: Date.now()
      });
      // Limit to 50 messages
      if (room.messages.length > 50) room.messages.shift();
      this.broadcastState(roomId);
    }
  }

  toggleSkip(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (room && room.state === 'IDLE') {
      const player = room.players.find(p => p.userId === userId);
      if (player) {
        player.isSpectator = !player.isSpectator;
        player.status = player.isSpectator ? 'waiting' : 'playing';
        this.broadcastState(roomId);
      }
    }
  }

  explicitLeave(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      const pIndex = room.players.findIndex(p => p.userId === userId);
      if (pIndex !== -1) {
        const p = room.players[pIndex];
        // If it was their turn, auto-stay
        if (room.state === 'PLAYER_TURN' && room.currentPlayerIndex === pIndex) {
          this.stay(roomId, p.id); // using socket.id
        }

        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          // Reassign banker if needed
          if (!room.players.some(p => p.isBanker) && room.players.length > 0) {
            room.players[0].isBanker = true;
          }
          this.broadcastState(roomId);
        }
      }
    }
  }

  leaveRoom(roomId: string, socketId: string) {
    // Handling unexpected socket disconnect
    const room = this.rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        player.status = 'disconnected';
        if (room.state === 'PLAYER_TURN' && room.players[room.currentPlayerIndex]?.id === socketId) {
           this.stay(roomId, player.id); 
        } else if (room.state === 'BANKER_TURN' && player.isBanker) {
           this.stay(roomId, player.id);
        }
        this.broadcastState(roomId);
      }
    }
  }

  startGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room && room.state === 'IDLE') {
      const activePlayers = room.players.filter(p => !p.isSpectator && p.status !== 'disconnected');
      if (activePlayers.length < 2) return; // Need at least 2 active players

      room.state = 'DEALING';
      room.deck = Deck.createShuffledDeck();
      
      // Reset players
      room.players.forEach(p => {
        if (!p.isSpectator && p.status !== 'disconnected') {
          p.cards = [];
          p.revealedCardIndexes = [];
          p.status = 'playing';
        } else {
          p.cards = [];
          p.revealedCardIndexes = [];
          p.status = 'waiting';
        }
      });

      this.broadcastState(roomId);

      const dealRecipients = room.players.filter(p => p.status === 'playing').length;
      const dealingDelay = Math.max(900, dealRecipients * 2 * 220 + 420);

      setTimeout(() => {
        const latestRoom = this.rooms.get(roomId);
        if (!latestRoom || latestRoom.state !== 'DEALING') return;

        // Deal 2 cards to each playing player
        for(let i = 0; i < 2; i++) {
          latestRoom.players.forEach(p => {
            if (p.status === 'playing' && latestRoom.deck.length > 0) {
              p.cards.push(latestRoom.deck.pop()!);
            }
          });
        }

        // Natural hands are auto-held immediately after deal
        latestRoom.players.forEach(p => {
          if (p.status !== 'playing') return;
          const score = calculatePoints(p.cards);
          if (score.isXiBang || score.isXiDach || score.isNgulinh || score.isBusted) {
            p.status = score.isBusted ? 'busted' : 'stay';
          }
        });

        const banker = latestRoom.players.find(p => p.isBanker);
        if (banker) {
          const bankerScore = calculatePoints(banker.cards);
          if (bankerScore.isXiBang || bankerScore.isXiDach) {
            // Banker has a natural hand: skip all turns and settle immediately.
            this.endGame(latestRoom);
            this.broadcastState(roomId);
            return;
          }
        }

        // Determine next turn
        const bankerIndex = latestRoom.players.findIndex(p => p.isBanker);
        let nextIndex = (bankerIndex + 1) % latestRoom.players.length;
        while (latestRoom.players[nextIndex].status !== 'playing' && nextIndex !== bankerIndex) {
          nextIndex = (nextIndex + 1) % latestRoom.players.length;
        }

        if (nextIndex === bankerIndex || latestRoom.players[nextIndex].status !== 'playing') {
           latestRoom.state = 'BANKER_TURN';
        } else {
           latestRoom.currentPlayerIndex = nextIndex;
           latestRoom.state = 'PLAYER_TURN';
        }

        this.broadcastState(roomId);
      }, dealingDelay);
    }
  }

  drawCard(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.state === 'PLAYER_TURN') {
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== socketId || currentPlayer.status !== 'playing') return;
      if (room.deck.length === 0 || currentPlayer.cards.length >= 5) return;

      currentPlayer.cards.push(room.deck.pop()!);
      const { isBusted } = calculatePoints(currentPlayer.cards);
      if (isBusted) {
        currentPlayer.status = 'busted';
        // Không tự động chuyển lượt khi quắc - để người chơi chủ động bấm nút dằn
      } else if (currentPlayer.cards.length === 5) {
        currentPlayer.status = 'stay';
        this.nextTurn(room);
      }
      this.broadcastState(roomId);
      return;
    }

    if (room.state === 'BANKER_TURN') {
      const banker = room.players.find(p => p.isBanker);
      if (!banker || banker.id !== socketId || banker.status !== 'playing') return;
      if (room.deck.length === 0 || banker.cards.length >= 5) return;

      banker.cards.push(room.deck.pop()!);
      const { isBusted } = calculatePoints(banker.cards);
      if (isBusted || banker.cards.length === 5) {
        banker.status = isBusted ? 'busted' : 'stay';
        this.endGame(room);
      }
      this.broadcastState(roomId);
    }
  }

  settlePlayer(roomId: string, bankerSocketId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'BANKER_TURN') return;

    const banker = room.players.find(p => p.isBanker);
    if (!banker || banker.id !== bankerSocketId) return;

    const bankerScore = calculatePoints(banker.cards);
    const bankerCanSettlePerPlayer =
      (banker.cards.length === 2 && bankerScore.points >= 15) ||
      (banker.cards.length >= 3 && bankerScore.points >= 16);
    if (!bankerCanSettlePerPlayer) return;

    const target = room.players.find(p => p.userId === targetUserId && !p.isBanker);
    if (!target) return;

    if (target.status === 'waiting' || target.status === 'disconnected') return;
    if (target.status === 'win' || target.status === 'lose' || target.status === 'draw') return;

    const targetScore = calculatePoints(target.cards);
    target.status = this.resolveAgainstBanker(targetScore, bankerScore);

    const unsettled = room.players.some(
      p => !p.isBanker && p.status !== 'waiting' && p.status !== 'disconnected' && p.status !== 'win' && p.status !== 'lose' && p.status !== 'draw'
    );

    if (!unsettled) {
      room.state = 'GAME_OVER';
      banker.status = 'stay';
      room.currentPlayerIndex = -1;
    }

    this.broadcastState(roomId);
  }

  settleAll(roomId: string, bankerSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'BANKER_TURN') return;

    const banker = room.players.find(p => p.isBanker);
    if (!banker || banker.id !== bankerSocketId) return;

    this.stay(roomId, bankerSocketId);
  }

  toggleCardReveal(roomId: string, socketId: string, cardIndex: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (!player || player.status === 'disconnected') return;
    if (!Number.isInteger(cardIndex)) return;
    if (cardIndex < 0 || cardIndex >= player.cards.length) return;

    const exists = player.revealedCardIndexes.includes(cardIndex);
    if (exists) {
      player.revealedCardIndexes = player.revealedCardIndexes.filter(i => i !== cardIndex);
    } else {
      player.revealedCardIndexes = [...player.revealedCardIndexes, cardIndex].sort((a, b) => a - b);
    }

    this.broadcastState(roomId);
  }

  stay(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    const { points, isXiBang, isXiDach, isNgulinh, isBusted } = calculatePoints(player.cards);

    let canStay = false;
    if (isBusted || isXiBang || isXiDach || isNgulinh || player.cards.length >= 5) {
      canStay = true;
    } else if (player.isBanker) {
      if (player.cards.length === 2 && points >= 15) canStay = true;
      else if (player.cards.length >= 3 && points >= 16) canStay = true;
    } else {
      if (points >= 16) canStay = true;
    }

    if (!canStay && player.status !== 'disconnected') return;

    if (room.state === 'PLAYER_TURN') {
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer.id !== socketId) return;
      
      currentPlayer.status = isBusted ? 'busted' : 'stay';
      this.nextTurn(room);
      this.broadcastState(roomId);
      return;
    }

    if (room.state === 'BANKER_TURN') {
      const banker = room.players.find(p => p.isBanker);
      if (!banker || banker.id !== socketId) return;

      banker.status = isBusted ? 'busted' : 'stay';
      this.endGame(room);
      this.broadcastState(roomId);
    }
  }

  private nextTurn(room: Room) {
    let nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
    const bankerIndex = room.players.findIndex(p => p.isBanker);
    
    // Find next valid player or banker
    while (nextIndex !== bankerIndex && room.players[nextIndex].status !== 'playing') {
      nextIndex = (nextIndex + 1) % room.players.length;
    }
    
    if (nextIndex === bankerIndex) {
      room.state = 'BANKER_TURN';
    } else {
      room.currentPlayerIndex = nextIndex;
    }
  }

  private endGame(room: Room) {
    room.state = 'GAME_OVER';
    room.currentPlayerIndex = -1;
    const banker = room.players.find(p => p.isBanker)!;
    const bankerScore = banker ? calculatePoints(banker.cards) : { points: 0, isBusted: true, isXiBang: false, isXiDach: false, isNgulinh: false };

    room.players.forEach(p => {
      if (p.isBanker) {
        p.status = 'stay';
        return;
      }

      if (p.status === 'win' || p.status === 'lose' || p.status === 'draw') {
        // Keep banker's previously confirmed per-player settle result.
        return;
      }

      if (p.status !== 'waiting' && p.status !== 'disconnected') {
        const pScore = calculatePoints(p.cards);
        p.status = this.resolveAgainstBanker(pScore, bankerScore);
      }
    });
    
  }

  nextRound(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'GAME_OVER') return;

    const banker = room.players.find(p => p.isBanker);
    if (!banker || banker.id !== socketId) return;

    room.state = 'IDLE';
    room.currentPlayerIndex = -1;
    room.deck = [];
    room.peekApprovals.clear(); // Reset peek approvals for new round

    if (room.pendingBankerUserId) {
      const nextBanker = room.players.find(
        p => p.userId === room.pendingBankerUserId && !p.isSpectator && p.status !== 'disconnected'
      );
      if (nextBanker) {
        room.players.forEach(p => {
          p.isBanker = p.userId === nextBanker.userId;
        });
      }
      room.pendingBankerUserId = undefined;
    }

    room.players.forEach(p => {
      if (p.status !== 'disconnected') {
        p.status = p.isSpectator ? 'waiting' : 'playing';
        p.cards = [];
        p.revealedCardIndexes = [];
      }
    });

    this.broadcastState(roomId);
  }

  transferBanker(roomId: string, requesterSocketId: string, targetUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const requester = room.players.find(p => p.id === requesterSocketId);
    if (!requester || !requester.isBanker) return false;

    const target = room.players.find(
      p => p.userId === targetUserId && !p.isSpectator && p.status !== 'disconnected'
    );
    if (!target || target.userId === requester.userId) return false;

    if (room.state === 'IDLE') {
      room.players.forEach(p => {
        p.isBanker = p.userId === target.userId;
      });
      room.pendingBankerUserId = undefined;
    } else {
      room.pendingBankerUserId = target.userId;
    }

    this.broadcastState(roomId);
    return true;
  }

  private resolveAgainstBanker(
    playerScore: { points: number, isBusted: boolean, isNgulinh: boolean, isXiBang: boolean, isXiDach: boolean },
    bankerScore: { points: number, isBusted: boolean, isNgulinh: boolean, isXiBang: boolean, isXiDach: boolean },
  ): 'win' | 'lose' | 'draw' {
    if (playerScore.isXiBang && !bankerScore.isXiBang) return 'win';
    if (bankerScore.isXiBang && !playerScore.isXiBang) return 'lose';
    if (playerScore.isXiDach && !bankerScore.isXiDach && !bankerScore.isXiBang) return 'win';
    if (bankerScore.isXiDach && !playerScore.isXiDach && !playerScore.isXiBang) return 'lose';
    if (playerScore.isNgulinh && !bankerScore.isNgulinh) return 'win';
    if (bankerScore.isNgulinh && !playerScore.isNgulinh) return 'lose';
    if (playerScore.isBusted && bankerScore.isBusted) return 'draw';
    if (playerScore.isBusted) return 'lose';
    if (bankerScore.isBusted) return 'win';
    if (playerScore.points > bankerScore.points) return 'win';
    if (playerScore.points < bankerScore.points) return 'lose';
    return 'draw';
  }

  setPlayerMicStatus(roomId: string, socketId: string, isMicOn: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.isMicOn = isMicOn;
      this.broadcastState(roomId);
    }
  }

  setPlayerSpeakingStatus(roomId: string, socketId: string, isSpeaking: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.isSpeaking = isSpeaking;
      this.broadcastState(roomId);
    }
  }

  sendPeekRequest(roomId: string, fromUserId: string, toUserId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Check if already approved in this round
    const approvalKey = `${fromUserId}|${toUserId}`;
    if (room.peekApprovals.has(approvalKey)) {
      return false; // Already peeked this round
    }

    // Check if request already pending
    const alreadyPending = room.peekRequests.some(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId
    );
    if (alreadyPending) return false;

    const fromPlayer = room.players.find(p => p.userId === fromUserId);
    if (!fromPlayer) return false;

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    room.peekRequests.push({
      fromUserId,
      fromPlayerName: fromPlayer.name,
      toUserId,
      requestId,
      timestamp: Date.now()
    });

    this.broadcastState(roomId);
    return true;
  }

  approvePeekRequest(roomId: string, toUserId: string, requestId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const request = room.peekRequests.find(r => r.requestId === requestId && r.toUserId === toUserId);
    if (!request) return false;

    const approvalKey = `${request.fromUserId}|${toUserId}`;
    room.peekApprovals.add(approvalKey);

    // Remove request
    room.peekRequests = room.peekRequests.filter(r => r.requestId !== requestId);

    this.broadcastState(roomId);
    return true;
  }

  rejectPeekRequest(roomId: string, toUserId: string, requestId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const request = room.peekRequests.find(r => r.requestId === requestId && r.toUserId === toUserId);
    if (!request) return false;

    // Just remove the request, don't record approval
    room.peekRequests = room.peekRequests.filter(r => r.requestId !== requestId);

    this.broadcastState(roomId);
    return true;
  }

  hasApprovedPeek(roomId: string, fromUserId: string, toUserId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const approvalKey = `${fromUserId}|${toUserId}`;
    return room.peekApprovals.has(approvalKey);
  }

  private broadcastState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Convert Set to array for Socket.io serialization
      const roomState = {
        ...room,
        peekApprovals: Array.from(room.peekApprovals)
      };
      this.io.to(roomId).emit('gameState', roomState);
    }
  }
}
