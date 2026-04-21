"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import type { DeceptionRoom } from "@/server/game/DeceptionTypes";
import RoleReveal from "@/components/deception/RoleReveal";
import NightPhase from "@/components/deception/NightPhase";
import DiscussionBoard from "@/components/deception/DiscussionBoard";
import WitnessHunt from "@/components/deception/WitnessHunt";
import GameOverScene from "@/components/deception/GameOverScene";
import ReturnConfirmModal from "@/components/deception/ReturnConfirmModal";
import VoiceChatPanel from "@/components/avalon/VoiceChatPanel";
import DeceptionLobby from "./DeceptionLobby";
import ForensicPanel from "../ForensicPanel";

const DECEPTION_BGM_SOURCE = "/deception_audio/deception_bg_audio.opt.ogg";
const DECEPTION_BGM_DEFAULT_VOLUME = 0.38;

const DECEPTION_BGM_STATES: Array<DeceptionRoom["state"]> = [
  "SCENE_SETUP",
  "DISCUSSION",
  "SOLVING_ATTEMPT",
  "WITNESS_HUNT",
  "GAME_OVER",
];

function generateUserId() {
  return Math.random().toString(36).slice(2, 11);
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

type ReturnIntent = "home" | "lobby";

export default function DeceptionBoard({ roomId }: { roomId: string }) {
  const router = useRouter();
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

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
  const [roleMaskEnabled, setRoleMaskEnabled] = useState(false);
  const [isDiscussionBgmMuted, setIsDiscussionBgmMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("deception_bgm_muted") === "1";
  });
  const [playerPings, setPlayerPings] = useState<Record<string, number>>({});
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [returnIntent, setReturnIntent] = useState<ReturnIntent>("home");

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
        suggestedName: storedPlayerName || "",
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

    socketio.on("playerPing", (pingUserId: string, ping: number) => {
      setPlayerPings((prev) => ({ ...prev, [pingUserId]: ping }));
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

  const connectedVoicePlayers = useMemo(
    () =>
      gameState?.players
        .filter((player) => player.status === "connected")
        .map((player) => ({
          userId: player.userId,
          name: player.name,
        })) ?? [],
    [gameState?.players],
  );

  useEffect(() => {
    if (!hydrated || !hasJoined || typeof window === "undefined") return;

    if (!bgmAudioRef.current) {
      const audio = new window.Audio();

      audio.src = DECEPTION_BGM_SOURCE;
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = DECEPTION_BGM_DEFAULT_VOLUME;
      audio.muted = isDiscussionBgmMuted;
      bgmAudioRef.current = audio;
    }

    const bgmAudio = bgmAudioRef.current;
    if (!bgmAudio) return;
    bgmAudio.volume = DECEPTION_BGM_DEFAULT_VOLUME;
    bgmAudio.muted = isDiscussionBgmMuted;

    const shouldPlayBgm = Boolean(
      gameState?.state && DECEPTION_BGM_STATES.includes(gameState.state),
    );

    if (shouldPlayBgm) {
      void bgmAudio.play().catch(() => undefined);
      return;
    }

    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }, [gameState?.state, hasJoined, hydrated, isDiscussionBgmMuted]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    sessionStorage.setItem(
      "deception_bgm_muted",
      isDiscussionBgmMuted ? "1" : "0",
    );

    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.muted = isDiscussionBgmMuted;
    bgmAudioRef.current.volume = DECEPTION_BGM_DEFAULT_VOLUME;
  }, [hydrated, isDiscussionBgmMuted]);

  useEffect(() => {
    return () => {
      const bgmAudio = bgmAudioRef.current;
      if (!bgmAudio) return;
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      bgmAudioRef.current = null;
    };
  }, []);

  const hostCanReturnLobby = Boolean(
    me?.isHost && gameState && gameState.state !== "LOBBY",
  );

  const requestReturn = (intent?: ReturnIntent) => {
    const nextIntent = intent ?? (hostCanReturnLobby ? "lobby" : "home");
    setReturnIntent(nextIntent);
    setShowReturnConfirm(true);
  };

  const closeReturnConfirm = () => {
    setShowReturnConfirm(false);
  };

  const confirmReturn = () => {
    setShowReturnConfirm(false);

    if (returnIntent === "lobby" && hostCanReturnLobby && socket) {
      socket.emit("returnToLobby");
      return;
    }

    router.push("/deception");
  };

  const returnConfirmTitle =
    returnIntent === "lobby" ? "Quay về lobby?" : "Về sảnh Deception?";
  const returnConfirmDescription =
    returnIntent === "lobby"
      ? "Bạn là chủ phòng. Hành động này sẽ đưa toàn bộ người chơi trở về phòng chờ."
      : "Bạn có chắc muốn rời phòng hiện tại và quay về sảnh Deception không?";
  const returnConfirmLabel = returnIntent === "lobby" ? "Về lobby" : "Về sảnh";

  const withReturnConfirm = (content: ReactNode, voicePosition: 'bottom-left' | 'bottom-right' = 'bottom-left') => (
    <>
      {content}
      {me && (
        <VoiceChatPanel
          roomId={gameState?.id ?? roomId}
          userId={me.userId}
          playerName={me.name}
          players={connectedVoicePlayers}
          position={voicePosition}
          themeClass="[--primary:var(--deception-cyan)] [--outline-variant:var(--on-surface)] [--on-surface-variant:rgba(255,255,255,0.7)]"
        />
      )}
      <ReturnConfirmModal
        open={showReturnConfirm}
        title={returnConfirmTitle}
        description={returnConfirmDescription}
        confirmLabel={returnConfirmLabel}
        confirmTone={returnIntent === "lobby" ? "red" : "cyan"}
        onCancel={closeReturnConfirm}
        onConfirm={confirmReturn}
      />
    </>
  );

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
              const finalName = playerName.trim();
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
      <>
        <DeceptionLobby
          gameState={gameState}
          me={me}
          socket={socket}
          roomId={roomId}
          playerPings={playerPings}
          setPlayerPings={setPlayerPings}
          onBackHome={() => router.push("/deception")}
          voiceSlot={me ? (
            <VoiceChatPanel
              roomId={gameState.id}
              userId={me.userId}
              playerName={me.name}
              players={connectedVoicePlayers}
              position="header-dropdown"
              themeClass="[--primary:var(--deception-cyan)] [--outline-variant:var(--on-surface)] [--on-surface-variant:rgba(255,255,255,0.7)]"
            />
          ) : undefined}
        />
      </>
    );
  }

  if (gameState.state === "ROLE_REVEAL") {
    return withReturnConfirm(
      <RoleReveal
        gameState={gameState}
        me={me}
        onReady={() => socket?.emit("playerReady")}
        onExit={() => requestReturn()}
      />
    );
  }

  if (gameState.state === "NIGHT_PHASE") {
    return withReturnConfirm(
      <NightPhase
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => requestReturn()}
      />
    );
  }

  if (gameState.state === "SCENE_SETUP") {
    return withReturnConfirm(
      <ForensicPanel
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => requestReturn()}
      />,
      "bottom-right",
    );
  }

  if (gameState.state === "DISCUSSION" || gameState.state === "SOLVING_ATTEMPT") {
    const voiceSlot = me ? (
      <VoiceChatPanel
        roomId={gameState.id}
        userId={me.userId}
        playerName={me.name}
        players={connectedVoicePlayers}
        position="header-dropdown"
        themeClass="[--primary:var(--deception-cyan)] [--outline-variant:var(--on-surface)] [--on-surface-variant:rgba(255,255,255,0.7)]"
      />
    ) : undefined;

    return (
      <>
        <DiscussionBoard
          gameState={gameState}
          me={me}
          socket={socket}
          playerPings={playerPings}
          roleMaskEnabled={roleMaskEnabled}
          bgmMuted={isDiscussionBgmMuted}
          onToggleRoleMask={() => setRoleMaskEnabled((prev) => !prev)}
          onToggleBgm={() => setIsDiscussionBgmMuted((prev) => !prev)}
          onExit={() => requestReturn()}
          voiceSlot={voiceSlot}
        />
        <ReturnConfirmModal
          open={showReturnConfirm}
          title={returnConfirmTitle}
          description={returnConfirmDescription}
          confirmLabel={returnConfirmLabel}
          confirmTone={returnIntent === "lobby" ? "red" : "cyan"}
          onCancel={closeReturnConfirm}
          onConfirm={confirmReturn}
        />
      </>
    );
  }

  if (gameState.state === "WITNESS_HUNT") {
    return withReturnConfirm(
      <WitnessHunt
        gameState={gameState}
        me={me}
        socket={socket}
        onExit={() => requestReturn()}
      />
    );
  }

  if (gameState.state === "GAME_OVER") {
    return withReturnConfirm(
      <GameOverScene
        gameState={gameState}
        me={me}
        onExit={() => requestReturn()}
        canReturnToLobby={hostCanReturnLobby}
        onReturnToLobby={() => requestReturn("lobby")}
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
          <button onClick={() => requestReturn()} className="deception-btn-outline px-4 py-2 text-xs uppercase tracking-[0.2em]">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Về sảnh Deception
            </span>
          </button>
          {me?.isHost && (
            <button
              onClick={() => requestReturn("lobby")}
              className="deception-btn-red px-4 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Quay lại lobby
            </button>
          )}
        </div>

        {errorMsg && <p className="mt-4 text-sm text-(--deception-red-soft)">{errorMsg}</p>}
      </div>

      <ReturnConfirmModal
        open={showReturnConfirm}
        title={returnConfirmTitle}
        description={returnConfirmDescription}
        confirmLabel={returnConfirmLabel}
        confirmTone={returnIntent === "lobby" ? "red" : "cyan"}
        onCancel={closeReturnConfirm}
        onConfirm={confirmReturn}
      />
    </div>
  );
}
