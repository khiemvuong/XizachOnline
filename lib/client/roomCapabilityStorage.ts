import { getAppStorage } from "./appStorage";

export type PangameId = "avalon" | "deception" | "weredog" | "glitcher";

function capabilityKey(gameId: PangameId, roomId: string, identityId: string) {
  return `pangames.reconnect.v1:${gameId}:${roomId}:${identityId}`;
}

export function readRoomCapability(
  gameId: PangameId,
  roomId: string,
  identityId: string,
): string | undefined {
  return getAppStorage()?.getItem(capabilityKey(gameId, roomId, identityId)) ?? undefined;
}

export function writeRoomCapability(
  gameId: PangameId,
  roomId: string,
  identityId: string,
  capability: string,
) {
  getAppStorage()?.setItem(capabilityKey(gameId, roomId, identityId), capability);
}

export function clearRoomCapability(
  gameId: PangameId,
  roomId: string,
  identityId: string,
) {
  getAppStorage()?.removeItem(capabilityKey(gameId, roomId, identityId));
}

