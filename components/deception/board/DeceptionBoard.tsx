"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import type { DeceptionRoom } from "@/server/game/DeceptionTypes";
import RoleReveal from "@/components/deception/RoleReveal";
import NightPhase from "@/components/deception/NightPhase";
import DiscussionBoard from "@/components/deception/DiscussionBoard";
import WitnessHunt from "@/components/deception/WitnessHunt";
import GameOverScene from "@/components/deception/GameOverScene";
import DeceptionLobby from "./DeceptionLobby";
import ForensicPanel from "../ForensicPanel";

function generateUserId() {
  return Math.random().toString(36).slice(2, 11);
}

function generateDisplayName() {
  const suffix = Math.floor(100 + Math.random() * 900);
  return `AGENT_${suffix}`;
}

function getStateLabel(state: DeceptionRoom["state"]) {
  switch (state) {
    case "NIGHT_PHASE":
      return "Night Phase";
    case "SCENE_SETUP":
      return "Scene Setup";
    case "DISCUSSION":
      return "Discussion";
    case "SOLVING_ATTEMPT":
      return "Solving";
    case "WITNESS_HUNT":
      return "Witness Hunt";
    case "GAME_OVER":
      return "Game Over";
    default:
      return state;
  }
}

export default function DeceptionBoard({ roomId }: { roomId: string }) {
  const router = useRouter();

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [nameDraft, setNameDraft] = useState("");
  const [joinedName, setJoinedName] = useState<string | null>(null);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<DeceptionRoom | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const initialized = useRef(false);

  const persistentIdentity = useMemo(
    () => {
      if (!hydrated) {
        return {
          userId: "",
          storedName: null as string | null,
          suggestedName: "",
        };
      }

      let storedUserId = sessionStorage.getItem("xz_userId");
      if (!storedUserId) {
        storedUserId = generateUserId();
        sessionStorage.setItem("xz_userId", storedUserId);
      }

      const storedPlayerName = sessionStorage.getItem("deception_playerName");

      return {
        userId: storedUserId,
        storedName: storedPlayerName,
        suggestedName: storedPlayerName || generateDisplayName(),
      };
    },
    [hydrated],
  );

  const userId = persistentIdentity.userId;
  const fallbackName = nameDraft || persistentIdentity.storedName || persistentIdentity.suggestedName;
  const playerName = joinedName ?? fallbackName;
  const hasJoined = Boolean(joinedName ?? persistentIdentity.storedName);

  useEffect(() => {
    if (!hydrated || !hasJoined || !userId || initialized.current) return;
    initialized.current = true;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/deception`, {
      reconnectionDelayMax: 10000,
    });

    socketio.on("connect", () => {
      setErrorMsg("");
      setSocket(socketio);
      socketio.emit("joinRoom", { roomId, playerName, userId });
    });

    socketio.on("stateUpdate", (state: DeceptionRoom) => {
      setGameState(state);
    });

    socketio.on("deceptionError", (msg: string) => {
      setErrorMsg(msg || "Không thể vào phòng.");
    });

    socketio.on("connect_error", () => {
      setErrorMsg("Không thể kết nối máy chủ Deception.");
    });

    return () => {
      socketio.disconnect();
      initialized.current = false;
    };
  }, [hydrated, hasJoined, playerName, roomId, userId]);

  const me = useMemo(() => {
    if (!gameState || !userId) return undefined;
    return gameState.players.find((p) => p.userId === userId);
  }, [gameState, userId]);

  if (!hydrated) {
    return (
      <div className="deception-room-bg flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--deception-cyan)" />
        <p className="text-sm uppercase tracking-[0.2em] text-(--on-surface-variant)">Đang đồng bộ danh tính...</p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="deception-room-bg flex h-dvh items-center justify-center px-4">
        <div className="deception-card w-full max-w-md rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-(--deception-cyan)">Join Case #{roomId}</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-(--on-surface)">
            Chọn danh tính
          </h1>

          <div className="mt-5 space-y-3">
            <label className="text-xs uppercase tracking-[0.18em] text-(--on-surface-variant)">Mật danh</label>
            <input
              value={playerName}
              onChange={(event) => setNameDraft(event.target.value.slice(0, 14))}
              className="deception-input w-full"
              placeholder="AGENT_404"
              autoFocus
            />
          </div>

          <button
            onClick={() => {
              const finalName = playerName.trim() || generateDisplayName();
              sessionStorage.setItem("deception_playerName", finalName);
              setJoinedName(finalName);
              setNameDraft(finalName);
            }}
            className="deception-btn-red mt-6 w-full py-3 text-sm font-extrabold uppercase tracking-[0.2em]"
          >
            Vào phòng điều tra
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="deception-room-bg flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--deception-cyan)" />
        <p className="text-sm uppercase tracking-[0.2em] text-(--on-surface-variant)">Đang kết nối hồ sơ vụ án...</p>
        {errorMsg && <p className="text-sm text-(--deception-red-soft)">{errorMsg}</p>}
        <button
          onClick={() => router.push("/deception")}
          className="deception-btn-outline inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.18em]"
        >
          <ArrowLeft className="h-4 w-4" />
          Về sảnh Deception
        </button>
      </div>
    );
  }

  if (gameState.state === "LOBBY") {
    return (
      <DeceptionLobby
        gameState={gameState}
        me={me}
        socket={socket}
        roomId={roomId}
        onBackHome={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "ROLE_REVEAL") {
    return (
      <RoleReveal
        gameState={gameState}
        me={me}
        onReady={() => socket?.emit("playerReady")}
        onExit={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "NIGHT_PHASE") {
    return (
      <NightPhase
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "SCENE_SETUP") {
    return (
      <ForensicPanel
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "DISCUSSION" || gameState.state === "SOLVING_ATTEMPT") {
    return (
      <DiscussionBoard
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "WITNESS_HUNT") {
    return (
      <WitnessHunt
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => router.push("/deception")}
      />
    );
  }

  if (gameState.state === "GAME_OVER") {
    return (
      <GameOverScene
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => router.push("/deception")}
      />
    );
  }

  return (
    <div className="deception-room-bg flex h-dvh items-center justify-center px-4 py-8">
      <div className="deception-card w-full max-w-2xl rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
          {getStateLabel(gameState.state)}
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-(--on-surface-variant)">
          UI cho phase này sẽ được triển khai ở phase kế tiếp của kế hoạch. Hiện tại đã có luồng đầy đủ tới
          discussion và solving, còn witness hunt/game over sẽ nối tiếp sau.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => router.push("/deception")} className="deception-btn-outline px-4 py-2 text-xs uppercase tracking-[0.2em]">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Về sảnh Deception
            </span>
          </button>
          {me?.isHost && (
            <button
              onClick={() => socket?.emit("returnToLobby")}
              className="deception-btn-red px-4 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Quay lại lobby
            </button>
          )}
        </div>

        {errorMsg && <p className="mt-4 text-sm text-(--deception-red-soft)">{errorMsg}</p>}
      </div>
    </div>
  );
}
