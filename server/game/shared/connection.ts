import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const RECONNECT_GRACE_MS = 5 * 60 * 1_000;
export const OFFLINE_ACTOR_HOLD_MS = 15 * 1_000;
export const MAX_SPECTATORS_PER_ROOM = 5;

export type PlayerConnectionState =
  | "connected"
  | "temporarily_disconnected"
  | "abandoned";

export interface ConnectionMetadata {
  reconnectTokenHash?: string;
  connectionState?: PlayerConnectionState;
  disconnectedAt?: number;
  reconnectDeadlineAt?: number;
}

function hashCapability(capability: string) {
  return createHash("sha256").update(capability, "utf8").digest("hex");
}

export function issueReconnectCapability() {
  const reconnectToken = randomBytes(32).toString("base64url");
  return {
    reconnectToken,
    reconnectTokenHash: hashCapability(reconnectToken),
  };
}

export function verifyReconnectCapability(
  reconnectTokenHash: string | undefined,
  reconnectToken: unknown,
) {
  if (!reconnectTokenHash || typeof reconnectToken !== "string" || !reconnectToken) {
    return false;
  }
  const actual = Buffer.from(hashCapability(reconnectToken), "hex");
  const expected = Buffer.from(reconnectTokenHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function markConnectionRestored(player: ConnectionMetadata) {
  player.connectionState = "connected";
  delete player.disconnectedAt;
  delete player.reconnectDeadlineAt;
}

export function markConnectionInterrupted(player: ConnectionMetadata, now = Date.now()) {
  player.connectionState = "temporarily_disconnected";
  player.disconnectedAt = now;
  player.reconnectDeadlineAt = now + RECONNECT_GRACE_MS;
}

export function markConnectionAbandoned(player: ConnectionMetadata) {
  player.connectionState = "abandoned";
  delete player.reconnectDeadlineAt;
}

export function stripConnectionMetadata<T extends ConnectionMetadata>(player: T) {
  delete player.reconnectTokenHash;
  delete player.disconnectedAt;
  delete player.reconnectDeadlineAt;
}

