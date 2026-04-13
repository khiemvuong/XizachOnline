import { type AvalonPlayer } from "@/server/game/AvalonTypes";
import { type Socket } from "socket.io-client";
import {
  Edit2,
  LogOut,
  BookText,
  Volume2,
  VolumeX,
  VenetianMask,
  EyeOff,
  Eye,
  // AlertTriangle,
  Hand,
} from "lucide-react";

export default function AvalonTopBar({
  me,
  // socket,
  isHost,
  isSpectator,
  isLobby,
  isGameOver,
  isRoleHidden,
  isHandRaised,
  isLobbyMusicEnabled,
  setIsLobbyMusicEnabled,
  setIsRoleHidden,
  setNewNameInput,
  setShowNameEditModal,
  setShowRules,
  setShowMyRole,
  handleBackButton,
  handleToggleRaiseHand,
}: {
  me?: AvalonPlayer;
  socket: Socket | null;
  isHost: boolean;
  isSpectator: boolean;
  isLobby: boolean;
  isGameOver: boolean;
  isRoleHidden: boolean;
  isHandRaised: boolean;
  isLobbyMusicEnabled: boolean;
  setIsLobbyMusicEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsRoleHidden: (v: boolean | ((prev: boolean) => boolean)) => void;
  setNewNameInput: (name: string) => void;
  setShowNameEditModal: (v: boolean) => void;
  setShowRules: (v: boolean) => void;
  setShowMyRole: (v: boolean) => void;
  handleBackButton: () => void;
  handleToggleRaiseHand: () => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
      {/* Edit Name Button — Lobby only */}
      {isLobby && (
        <button
          onClick={() => {
            setNewNameInput(me?.name ?? "");
            setShowNameEditModal(true);
          }}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title="Đổi tên"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      )}

      {/* Back button */}
      <button
        onClick={handleBackButton}
        className="p-2 bg-black/40 backdrop-blur-md border border-slate-600/40 rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors shadow-lg cursor-pointer"
        title={
          isHost && !isLobby && !isGameOver
            ? "Kết thúc ván — Đưa tất cả về thiết lập phòng"
            : "Thoát phòng — Nhập mã phòng khác"
        }
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* Rules */}
      <button
        onClick={() => setShowRules(true)}
        className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
        title="Luật Chơi"
      >
        <BookText className="w-5 h-5" />
      </button>

      {/* Sound toggle — lobby only */}
      {isLobby && (
        <button
          onClick={() => setIsLobbyMusicEnabled((prev) => !prev)}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title={isLobbyMusicEnabled ? "Tắt nhạc sảnh" : "Bật nhạc sảnh"}
        >
          {isLobbyMusicEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      )}

      {/* My Role — in-game only */}
      {!isLobby && me?.role && !isSpectator && (
        <button
          onClick={() => setShowMyRole(true)}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title="Bài Của Bạn"
        >
          <VenetianMask className="w-5 h-5" />
        </button>
      )}

      {/* Privacy Shield — in-game only */}
      {!isLobby && !isGameOver && !isSpectator && (
        <button
          onClick={() => setIsRoleHidden((p) => !p)}
          className={`p-2 bg-black/40 backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer border ${
            isRoleHidden
              ? "border-amber-500/60 text-amber-400 hover:bg-amber-500/10"
              : "border-(--primary)/30 text-(--primary) hover:bg-(--primary)/10 hover:text-white"
          }`}
          title={isRoleHidden ? "Hiện thông tin vai trò" : "Ẩn thông tin vai trò"}
        >
          {isRoleHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}

      {/* Early end — in-game only (Temporarily Disabled) */}
      {/* {!isLobby && !isGameOver && !isSpectator && (
        <button
          onClick={() => socket?.emit("voteEarlyEnd", true)}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--tertiary)/30 rounded-full hover:bg-(--tertiary)/10 text-(--tertiary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title="Xin Huỷ Trận Đấu"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
      )} */}

      {/* Raise hand */}
      {!isLobby && !isGameOver && me && (
        <button
          onClick={handleToggleRaiseHand}
          className={`p-2 bg-black/40 backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer border ${
            isHandRaised
              ? "border-emerald-400/70 text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25"
              : "border-(--primary)/30 text-(--primary) hover:bg-(--primary)/10 hover:text-white"
          }`}
          title={isHandRaised ? "Bỏ tay xuống" : "Dơ tay tượng trưng"}
        >
          <Hand className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
