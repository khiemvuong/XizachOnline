import type { DeceptionGameState, DeceptionRole } from "./DeceptionTypes";

type DeceptionVoicePlayerSnapshot = {
  userId: string;
  role?: DeceptionRole;
  status: "connected" | "disconnected";
  isSpectator: boolean;
};

type DeceptionVoiceRoomSnapshot = {
  roomId: string;
  state: DeceptionGameState;
  players: Map<string, DeceptionVoicePlayerSnapshot>;
  updatedAt: number;
};

export type DeceptionVoicePolicyReason =
  | "ok"
  | "unknown-user"
  | "spectator"
  | "disconnected"
  | "forensic-muted";

export type DeceptionVoiceAccessPolicy = {
  roomType: "deception" | "other";
  canPublish: boolean;
  reason: DeceptionVoicePolicyReason;
};

const deceptionVoiceRooms = new Map<string, DeceptionVoiceRoomSnapshot>();
const FORENSIC_MUTE_STATES: ReadonlySet<DeceptionGameState> = new Set([
  "DISCUSSION",
  "SOLVING_ATTEMPT",
]);

export function upsertDeceptionVoiceRoom(snapshot: {
  roomId: string;
  state: DeceptionGameState;
  players: DeceptionVoicePlayerSnapshot[];
}) {
  const playersMap = new Map<string, DeceptionVoicePlayerSnapshot>();
  for (const player of snapshot.players) {
    playersMap.set(player.userId, player);
  }

  deceptionVoiceRooms.set(snapshot.roomId, {
    roomId: snapshot.roomId,
    state: snapshot.state,
    players: playersMap,
    updatedAt: Date.now(),
  });
}

export function removeDeceptionVoiceRoom(roomId: string) {
  deceptionVoiceRooms.delete(roomId);
}

export function getDeceptionVoiceAccessPolicy(
  roomId: string,
  userId: string,
): DeceptionVoiceAccessPolicy {
  const room = deceptionVoiceRooms.get(roomId);
  if (!room) {
    return {
      roomType: "other",
      canPublish: true,
      reason: "ok",
    };
  }

  const player = room.players.get(userId);
  if (!player) {
    return {
      roomType: "deception",
      canPublish: false,
      reason: "unknown-user",
    };
  }

  if (player.isSpectator) {
    return {
      roomType: "deception",
      canPublish: false,
      reason: "spectator",
    };
  }

  if (player.status !== "connected") {
    return {
      roomType: "deception",
      canPublish: false,
      reason: "disconnected",
    };
  }

  if (player.role === "ForensicScientist" && FORENSIC_MUTE_STATES.has(room.state)) {
    return {
      roomType: "deception",
      canPublish: false,
      reason: "forensic-muted",
    };
  }

  return {
    roomType: "deception",
    canPublish: true,
    reason: "ok",
  };
}
