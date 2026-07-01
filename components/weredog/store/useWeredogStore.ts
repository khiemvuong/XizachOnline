import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { type WeredogRoom } from "@/server/game/WeredogTypes";

interface WeredogState {
  // State
  socket: Socket | null;
  gameState: WeredogRoom | null;
  userId: string;

  // Actions
  connect: (roomId: string, profile: { name: string; avatarUrl: string | null }) => void;
  disconnect: () => void;
  updateProfile: (name: string, avatarUrl: string | null) => void;
  startGame: () => void;
  playerReady: () => void;
  updateSettings: (settings: { wolfCount: number; enabledRoles: string[] }) => void;
  
  // Gameplay Actions
  wolfVote: (targetUserId: string) => void;
  wolfRevote: () => void;
  bodyguardProtect: (targetUserId: string) => void;
  seerInspect: (targetUserId: string) => void;
  hunterAim: (targetUserId: string) => void;
  cupidPair: (userId1: string, userId2: string) => void;
  witchChooseAction: (action: "save" | "kill" | "none") => void;
  witchUsePotion: (targetUserId?: string) => void;
  hostConfirmNightAction: () => void;
  startDayVoting: () => void;
  dayVote: (targetUserId: string | "skip") => void;
  hostConfirmDayVote: () => void;
  hostTiebreakerDecision: (decision: "skip" | "revote") => void;
  returnToLobby: () => void;
  transferHost: (targetUserId: string) => void;
}

export const useWeredogStore = create<WeredogState>((set, get) => ({
  // Initial States
  socket: null,
  gameState: null,
  userId: "",

  // Socket Lifecycle Connection
  connect: (roomId, profile) => {
    if (typeof window === "undefined") return;

    let storedUserId = localStorage.getItem("xz_userId");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(2, 10);
      localStorage.setItem("xz_userId", storedUserId);
    }
    set({ userId: storedUserId });

    // Close any previous connection
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/weredog`, {
      reconnectionDelayMax: 10000,
    });

    socketio.on("connect", () => {
      set({ socket: socketio });
      const nameToUse = profile.name || `Chó_${Math.floor(Math.random() * 1000)}`;
      socketio.emit("joinRoom", {
        roomId,
        playerName: nameToUse,
        userId: storedUserId,
        avatarUrl: profile.avatarUrl,
      });
    });

    socketio.on("stateUpdate", (state: WeredogRoom) => {
      set({ gameState: state });
    });

    socketio.on("weredogError", (err: string) => {
      console.error("Weredog room error:", err);
    });

    set({ socket: socketio });
  },

  disconnect: () => {
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
    }
    set({ socket: null, gameState: null });
  },

  // Profile Updating
  updateProfile: (name, avatarUrl) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("changeName", name);
      socket.emit("updateAvatar", avatarUrl);
    }
  },

  // Game start and setting controls
  startGame: () => {
    const socket = get().socket;
    if (socket) socket.emit("startGame");
  },

  playerReady: () => {
    const socket = get().socket;
    if (socket) socket.emit("playerReady");
  },

  updateSettings: (settings) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("updateSettings", {
        wolfCount: settings.wolfCount,
        enabledRoles: settings.enabledRoles,
      });
    }
  },

  // Night Actions
  wolfVote: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("wolfVote", targetUserId);
  },

  wolfRevote: () => {
    const socket = get().socket;
    if (socket) socket.emit("wolfRevote");
  },

  bodyguardProtect: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("bodyguardProtect", targetUserId);
  },

  seerInspect: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("seerInspect", targetUserId);
  },

  hunterAim: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("hunterAim", targetUserId);
  },

  cupidPair: (userId1, userId2) => {
    const socket = get().socket;
    if (socket) socket.emit("cupidPair", { userId1, userId2 });
  },

  witchChooseAction: (action) => {
    const socket = get().socket;
    if (socket) socket.emit("witchChooseAction", action);
  },

  witchUsePotion: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("witchUsePotion", targetUserId);
  },

  hostConfirmNightAction: () => {
    const socket = get().socket;
    if (socket) socket.emit("hostConfirmNightAction");
  },

  // Day Actions
  startDayVoting: () => {
    const socket = get().socket;
    if (socket) {
      socket.emit("startDayVoting");
    }
  },

  dayVote: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("dayVote", targetUserId);
  },

  hostConfirmDayVote: () => {
    const socket = get().socket;
    if (socket) socket.emit("hostConfirmDayVote");
  },

  hostTiebreakerDecision: (decision) => {
    const socket = get().socket;
    if (socket) socket.emit("hostTiebreakerDecision", decision);
  },

  returnToLobby: () => {
    const socket = get().socket;
    if (socket) socket.emit("returnToLobby");
  },

  transferHost: (targetUserId) => {
    const socket = get().socket;
    if (socket) socket.emit("transferHost", targetUserId);
  },
}));
