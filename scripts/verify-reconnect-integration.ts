import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { io as createClient, type Socket } from "socket.io-client";
import { AvalonEngine } from "../server/game/AvalonEngine";
import { DeceptionEngine } from "../server/game/DeceptionEngine";
import { GlitcherEngine } from "../server/game/GlitcherEngine";
import { WeredogEngine } from "../server/game/WeredogEngine";

function once<T>(socket: Socket, event: string, timeoutMs = 2_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

async function connect(url: string) {
  const socket = createClient(url, { forceNew: true, transports: ["websocket"] });
  await once(socket, "connect");
  return socket;
}

async function createRoom(socket: Socket, roomId: string) {
  const created = await new Promise<boolean>((resolve) => {
    socket.emit("createRoom", roomId, resolve);
  });
  assert.equal(created, true);
}

async function verifyNamespace(options: {
  baseUrl: string;
  namespace: string;
  roomId: string;
  stateEvent: string;
  errorEvent: string;
  hasDefaultGameplayTimer: boolean;
}) {
  const url = `${options.baseUrl}${options.namespace}`;
  const identityId = `identity-${options.namespace.slice(1)}`;
  const host = await connect(url);
  await createRoom(host, options.roomId);

  const firstCapabilityPromise = once<{ reconnectToken: string }>(host, "sessionEstablished");
  const firstStatePromise = once<{
    timing: Record<string, { enabled: boolean; durationMs: number }>;
  }>(host, options.stateEvent);
  host.emit("joinRoom", {
    roomId: options.roomId,
    playerName: "Host",
    userId: identityId,
  });
  const firstCapability = (await firstCapabilityPromise).reconnectToken;
  const firstState = await firstStatePromise;
  assert.ok(firstCapability.length >= 40);
  assert.equal(
    Object.values(firstState.timing).some((timer) => timer.enabled),
    options.hasDefaultGameplayTimer,
  );
  host.disconnect();

  const impostor = await connect(url);
  const rejectionPromise = once<unknown>(impostor, options.errorEvent);
  impostor.emit("joinRoom", {
    roomId: options.roomId,
    playerName: "Impostor",
    userId: identityId,
    reconnectToken: "wrong-capability",
  });
  const rejection = await rejectionPromise;
  assert.ok(rejection);
  impostor.disconnect();

  const restored = await connect(url);
  const rotatedCapabilityPromise = once<{ reconnectToken: string }>(restored, "sessionEstablished");
  const restoredStatePromise = once(restored, options.stateEvent);
  restored.emit("joinRoom", {
    roomId: options.roomId,
    playerName: "Host",
    userId: identityId,
    reconnectToken: firstCapability,
  });
  const rotatedCapability = (await rotatedCapabilityPromise).reconnectToken;
  await restoredStatePromise;
  assert.notEqual(rotatedCapability, firstCapability);
  restored.disconnect();
}

async function main() {
  const httpServer = createServer();
  const socketServer = new SocketServer(httpServer, { cors: { origin: "*" } });
  new AvalonEngine(socketServer);
  new DeceptionEngine(socketServer);
  new WeredogEngine(socketServer);
  const glitcher = new GlitcherEngine(socketServer);

  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await verifyNamespace({ baseUrl, namespace: "/avalon", roomId: "4101", stateEvent: "avalonGameState", errorEvent: "avalonError", hasDefaultGameplayTimer: false });
    await verifyNamespace({ baseUrl, namespace: "/deception", roomId: "4102", stateEvent: "stateUpdate", errorEvent: "deceptionError", hasDefaultGameplayTimer: true });
    await verifyNamespace({ baseUrl, namespace: "/weredog", roomId: "4103", stateEvent: "stateUpdate", errorEvent: "weredogError", hasDefaultGameplayTimer: false });
    await verifyNamespace({ baseUrl, namespace: "/glitcher", roomId: "410004", stateEvent: "stateUpdate", errorEvent: "glitcherError", hasDefaultGameplayTimer: false });
    console.log("Reconnect integration checks passed for all four games.");
  } finally {
    glitcher.dispose();
    socketServer.close();
    httpServer.close();
  }
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
