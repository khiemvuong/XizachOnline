import { createServer } from "node:http";
import { Server } from "socket.io";
import { AvalonEngine } from "./server/game/AvalonEngine";
import { DeceptionEngine } from "./server/game/DeceptionEngine";
import { WeredogEngine } from "./server/game/WeredogEngine";
import { GlitcherEngine } from "./server/game/GlitcherEngine";

const port = parseInt(process.env.PORT || "3000", 10);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "pangames-backend" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*" ? "*" : allowedOrigins,
    methods: ["GET", "POST"],
  },
});

new AvalonEngine(io);
new DeceptionEngine(io);
new WeredogEngine(io);
new GlitcherEngine(io);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Backend ready on port ${port}`);
});
