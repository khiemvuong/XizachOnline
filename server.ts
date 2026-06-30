import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { GameEngine } from './server/game/GameEngine';
import { AvalonEngine } from './server/game/AvalonEngine';
import { DeceptionEngine } from './server/game/DeceptionEngine';
import { WeredogEngine } from './server/game/WeredogEngine';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const gameEngine = new GameEngine(io);
  new AvalonEngine(io);
  new DeceptionEngine(io);
  new WeredogEngine(io);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', ({ roomId, playerName, peerId, userId }) => {
      if (!userId) return;
      gameEngine.joinRoom(roomId, {
        id: socket.id,
        userId,
        name: playerName,
        peerId
      }, socket);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
    });

    socket.on('chatMessage', (text: string) => {
      if (socket.data.roomId && socket.data.userId) {
        gameEngine.chatMessage(socket.data.roomId, socket.data.userId, text);
      }
    });

    socket.on('toggleSkip', () => {
      if (socket.data.roomId && socket.data.userId) {
        gameEngine.toggleSkip(socket.data.roomId, socket.data.userId);
      }
    });

    socket.on('explicitLeave', () => {
      if (socket.data.roomId && socket.data.userId) {
        gameEngine.explicitLeave(socket.data.roomId, socket.data.userId);
        socket.leave(socket.data.roomId);
        delete socket.data.roomId;
      }
    });

    socket.on('startGame', () => {
      if (socket.data.roomId) gameEngine.startGame(socket.data.roomId);
    });

    socket.on('drawCard', () => {
      if (socket.data.roomId) gameEngine.drawCard(socket.data.roomId, socket.id);
    });

    socket.on('toggleCardReveal', (cardIndex: number) => {
      if (socket.data.roomId) {
        gameEngine.toggleCardReveal(socket.data.roomId, socket.id, cardIndex);
      }
    });

    socket.on('stay', () => {
      if (socket.data.roomId) gameEngine.stay(socket.data.roomId, socket.id);
    });

    socket.on('settlePlayer', (targetUserId: string) => {
      if (socket.data.roomId && targetUserId) {
        gameEngine.settlePlayer(socket.data.roomId, socket.id, targetUserId);
      }
    });

    socket.on('settleAll', () => {
      if (socket.data.roomId) {
        gameEngine.settleAll(socket.data.roomId, socket.id);
      }
    });

    socket.on('nextRound', () => {
      if (socket.data.roomId) gameEngine.nextRound(socket.data.roomId, socket.id);
    });

    socket.on('transferBanker', (targetUserId: string) => {
      if (socket.data.roomId && targetUserId) {
        gameEngine.transferBanker(socket.data.roomId, socket.id, targetUserId);
      }
    });

    socket.on('toggleMic', (isMicOn: boolean) => {
      if (socket.data.roomId) {
        gameEngine.setPlayerMicStatus(socket.data.roomId, socket.id, isMicOn);
      }
    });

    socket.on('voiceActivity', ({ isSpeaking }: { isSpeaking: boolean }) => {
      if (socket.data.roomId) {
        gameEngine.setPlayerSpeakingStatus(socket.data.roomId, socket.id, isSpeaking);
      }
    });

    socket.on('sendPeekRequest', (toUserId: string) => {
      if (socket.data.roomId && socket.data.userId && toUserId) {
        gameEngine.sendPeekRequest(socket.data.roomId, socket.data.userId, toUserId);
      }
    });

    socket.on('approvePeekRequest', ({ requestId }: { requestId: string }) => {
      if (socket.data.roomId && socket.data.userId && requestId) {
        gameEngine.approvePeekRequest(socket.data.roomId, socket.data.userId, requestId);
      }
    });

    socket.on('rejectPeekRequest', ({ requestId }: { requestId: string }) => {
      if (socket.data.roomId && socket.data.userId && requestId) {
        gameEngine.rejectPeekRequest(socket.data.roomId, socket.data.userId, requestId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (socket.data.roomId) {
        gameEngine.leaveRoom(socket.data.roomId, socket.id);
      }
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
