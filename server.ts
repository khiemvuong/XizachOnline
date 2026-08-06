import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { AvalonEngine } from './server/game/AvalonEngine';
import { DeceptionEngine } from './server/game/DeceptionEngine';
import { WeredogEngine } from './server/game/WeredogEngine';
import { GlitcherEngine } from './server/game/GlitcherEngine';

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

  new AvalonEngine(io);
  new DeceptionEngine(io);
  new WeredogEngine(io);
  new GlitcherEngine(io);

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
