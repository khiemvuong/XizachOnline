"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, LoaderCircle, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import type {
  GlitcherActionAck,
  GlitcherClientState,
  GlitcherPublicPlayer,
} from "@/server/game/GlitcherTypes";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import RoleReveal from "../RoleReveal";
import type { EmitGlitcherAction, GlitcherActionEvent } from "../gameTypes";
import DiscussionScreen from "../screens/DiscussionScreen";
import QuestionRoundScreen from "../screens/QuestionRoundScreen";
import RevealScreen from "../screens/RevealScreen";
import GlitcherLobby from "./GlitcherLobby";
import { getOrCreateBrowserIdentity } from "@/lib/client/playerIdentity";
import { readRoomCapability, writeRoomCapability } from "@/lib/client/roomCapabilityStorage";

function createActionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSocketError(error: unknown) {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as GlitcherActionAck).message;
    if (message) return message;
  }
  return "Dữ liệu vừa gửi không được máy chủ chấp nhận.";
}

export default function GlitcherBoard({ roomId }: { roomId: string }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { profile, updateProfile } = usePlayerProfile();
  const [nameDraft, setNameDraft] = useState("");
  const [joinedName, setJoinedName] = useState<string | null>(null);
  const [userId] = useState(() => getOrCreateBrowserIdentity());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GlitcherClientState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const validRoomId = /^\d{6}$/.test(roomId);
  const playerName = (joinedName ?? profile.name).trim();

  useEffect(() => {
    if (!hydrated || !validRoomId || !playerName || !userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/glitcher`, {
      reconnectionDelayMax: 10000,
    });

    socketio.on("connect", () => {
      setSocket(socketio);
      setErrorMessage("");
      const reconnectToken = readRoomCapability("glitcher", roomId, userId);
      socketio.emit("joinRoom", {
        roomId,
        playerName,
        userId,
        reconnectToken,
      });
    });

    socketio.on("stateUpdate", (nextState: GlitcherClientState) => {
      setGameState(nextState);
      setErrorMessage("");
    });

    socketio.on("sessionEstablished", ({ reconnectToken }: { reconnectToken: string }) => {
      writeRoomCapability("glitcher", roomId, userId, reconnectToken);
    });

    socketio.on("glitcherError", (error: unknown) => {
      setErrorMessage(normalizeSocketError(error));
    });

    socketio.on("connect_error", () => {
      setErrorMessage("Không thể kết nối máy chủ The Glitcher.");
    });

    socketio.on("sessionReplaced", () => {
      setErrorMessage(
        "Phiên chơi này vừa được tiếp quản ở một tab hoặc thiết bị khác.",
      );
    });

    return () => {
      socketio.disconnect();
      setSocket((currentSocket) => (currentSocket === socketio ? null : currentSocket));
    };
  }, [hydrated, playerName, roomId, userId, validRoomId]);

  const me = useMemo<GlitcherPublicPlayer | undefined>(() => {
    if (!gameState) return undefined;
    const viewerUserId = gameState.viewerUserId ?? userId;
    return gameState.players.find((player) => player.userId === viewerUserId);
  }, [gameState, userId]);

  const emitAction = useCallback<EmitGlitcherAction>(
    (event: GlitcherActionEvent, payload = {}) => {
      if (!socket?.connected) {
        setErrorMessage("Mất kết nối máy chủ. Đang thử kết nối lại…");
        return;
      }

      socket.emit(event, {
        ...payload,
        actionId: createActionId(),
      });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    let finished = false;
    const finishLeaving = () => {
      if (finished) return;
      finished = true;
      router.push("/glitcher");
    };

    if (!socket?.connected) {
      finishLeaving();
      return;
    }

    const fallbackTimer = window.setTimeout(finishLeaving, 700);
    socket.emit(
      "explicitLeave",
      { actionId: createActionId() },
      () => {
        window.clearTimeout(fallbackTimer);
        finishLeaving();
      },
    );
  }, [router, socket]);

  if (!validRoomId) {
    return (
      <div className="glitcher-status-screen">
        <AlertTriangle aria-hidden="true" />
        <h1>Mã phòng không hợp lệ</h1>
        <p>Đường dẫn phòng phải chứa đúng sáu chữ số.</p>
        <button type="button" onClick={() => router.push("/glitcher")} className="glitcher-secondary-button">
          <ArrowLeft aria-hidden="true" />
          <span>Về màn hình nhập mã</span>
        </button>
      </div>
    );
  }

  if (!hydrated || (playerName && !userId)) {
    return (
      <div className="glitcher-status-screen" role="status">
        <LoaderCircle className="glitcher-spinner" aria-hidden="true" />
        <p>Đang khôi phục danh tính…</p>
      </div>
    );
  }

  if (!playerName) {
    return (
      <div className="glitcher-name-screen">
        <div className="glitcher-glitch-overlay" aria-hidden="true" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const finalName = nameDraft.trim().slice(0, 14);
            if (!finalName) return;
            updateProfile({ name: finalName });
            setJoinedName(finalName);
          }}
        >
          <span>Phòng {roomId}</span>
          <h1>Chọn tên hiển thị</h1>
          <p>Tên này sẽ nằm cạnh avatar ghế của bạn trong suốt tour.</p>
          <label htmlFor="glitcher-player-name">Tên của bạn</label>
          <input
            id="glitcher-player-name"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value.slice(0, 14))}
            autoComplete="nickname"
            autoFocus
            placeholder="Ví dụ: An"
          />
          <button
            type="submit"
            disabled={!nameDraft.trim()}
            className="glitcher-primary-button"
          >
            Vào phòng
          </button>
        </form>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="glitcher-status-screen" role="status">
        <LoaderCircle className="glitcher-spinner" aria-hidden="true" />
        <h1>Đang nối dữ liệu phòng {roomId}</h1>
        <p>{errorMessage || "Giữ màn hình này mở trong giây lát."}</p>
        <button type="button" onClick={leaveRoom} className="glitcher-secondary-button">
          <ArrowLeft aria-hidden="true" />
          <span>Quay lại</span>
        </button>
      </div>
    );
  }

  if (me?.isSpectator) {
    return (
      <div className="glitcher-status-screen">
        <span>Khán giả · Phòng {roomId}</span>
        <h1>Trận đấu đang diễn ra</h1>
        <p>
          Bạn đang xem ở chế độ khán giả. Vai bí mật và hành động của người chơi
          không được gửi tới phiên này.
        </p>
        <p>Giai đoạn hiện tại: {gameState.state}</p>
        <button type="button" onClick={leaveRoom} className="glitcher-secondary-button">
          <ArrowLeft aria-hidden="true" />
          <span>Rời phòng</span>
        </button>
      </div>
    );
  }

  let content: React.ReactNode;

  switch (gameState.state) {
    case "LOBBY":
      content = (
        <GlitcherLobby gameState={gameState} me={me} emitAction={emitAction} onExit={leaveRoom} />
      );
      break;
    case "ROLE_REVEAL":
      content = (
        <RoleReveal gameState={gameState} me={me} emitAction={emitAction} onExit={leaveRoom} />
      );
      break;
    case "PERFORMANCE_AND_QUESTIONS":
      content = (
        <QuestionRoundScreen gameState={gameState} me={me} emitAction={emitAction} onExit={leaveRoom} />
      );
      break;
    case "DISCUSSION":
    case "VOTING":
      content = (
        <DiscussionScreen gameState={gameState} me={me} emitAction={emitAction} onExit={leaveRoom} />
      );
      break;
    case "REVEAL":
      content = (
        <RevealScreen gameState={gameState} me={me} emitAction={emitAction} onExit={leaveRoom} />
      );
      break;
    default:
      content = null;
  }

  return (
    <>
      {content}
      {errorMessage ? (
        <div className="glitcher-error-toast" role="alert">
          <AlertTriangle aria-hidden="true" />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage("")} aria-label="Đóng thông báo lỗi">
            <X aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
