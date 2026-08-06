import assert from "node:assert/strict";
import {
  MAX_SPECTATORS_PER_ROOM,
  OFFLINE_ACTOR_HOLD_MS,
  RECONNECT_GRACE_MS,
  issueReconnectCapability,
  markConnectionAbandoned,
  markConnectionInterrupted,
  markConnectionRestored,
  verifyReconnectCapability,
} from "../server/game/shared/connection";
import {
  configuredDurationMs,
  disabledGameplayTimer,
  enabledGameplayTimer,
} from "../server/game/shared/timing";

assert.equal(RECONNECT_GRACE_MS, 5 * 60 * 1_000);
assert.equal(OFFLINE_ACTOR_HOLD_MS, 15 * 1_000);
assert.equal(MAX_SPECTATORS_PER_ROOM, 5);
assert.equal(configuredDurationMs(disabledGameplayTimer()), null);
assert.equal(configuredDurationMs(enabledGameplayTimer(30_000)), 30_000);

const first = issueReconnectCapability();
const second = issueReconnectCapability();
assert.notEqual(first.reconnectToken, second.reconnectToken);
assert.notEqual(first.reconnectTokenHash, first.reconnectToken);
assert.equal(verifyReconnectCapability(first.reconnectTokenHash, first.reconnectToken), true);
assert.equal(verifyReconnectCapability(first.reconnectTokenHash, second.reconnectToken), false);
assert.equal(verifyReconnectCapability(first.reconnectTokenHash, ""), false);

const connection: {
  connectionState?: "connected" | "temporarily_disconnected" | "abandoned";
  disconnectedAt?: number;
  reconnectDeadlineAt?: number;
} = {};
markConnectionInterrupted(connection, 1_000);
assert.equal(connection.connectionState, "temporarily_disconnected");
assert.equal(connection.disconnectedAt, 1_000);
assert.equal(connection.reconnectDeadlineAt, 1_000 + RECONNECT_GRACE_MS);
markConnectionAbandoned(connection);
assert.equal(connection.connectionState, "abandoned");
assert.equal(connection.reconnectDeadlineAt, undefined);
markConnectionRestored(connection);
assert.equal(connection.connectionState, "connected");
assert.equal(connection.disconnectedAt, undefined);

console.log("Connection and timing policy checks passed.");
