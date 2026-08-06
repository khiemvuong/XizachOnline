"use client";

import { ReactNode, useState } from "react";
import { Users } from "lucide-react";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import { useWeredogStore } from "./store/useWeredogStore";
import { ROLE_DISPLAY, type WeredogRoleName } from "./nightConstants";
import RoleAccessory from "./RoleAccessory";

interface WeredogHeaderProps {
  roomId?: string;
  title?: string;
  playerCount?: number;
  centerContent?: ReactNode;
  profileAvatarUrl?: string | null;
  profileName?: string;
  onOpenProfile?: () => void;
  onBack?: () => void;
}

export default function WeredogHeader({
  roomId,
  title,
  playerCount,
  centerContent,
  profileAvatarUrl,
  profileName,
  onOpenProfile,
  onBack,
}: WeredogHeaderProps) {
  const [showCardModal, setShowCardModal] = useState(false);
  const [showWolfWinConfirm, setShowWolfWinConfirm] = useState(false);
  const { gameState, userId, hostDeclareWolfWin } = useWeredogStore();

  const me = gameState?.players.find((p) => p.userId === userId);
  const myRole = me?.role as WeredogRoleName | undefined;
  const roleMeta = myRole ? ROLE_DISPLAY[myRole] : null;
  const canHostDeclareWolfWin =
    !!me?.isHost && !!gameState && gameState.state !== "LOBBY" && gameState.state !== "GAME_OVER";

  return (
    <div className="w-full bg-[#0b0d11]/85 border-b border-[#445257]/20 px-6 h-12 flex items-center justify-between relative select-none z-20">
      {/* Left side content */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-7 h-7 rounded bg-[#222a2f]/60 border border-[#445257]/30 text-[#829ea2] hover:text-white hover:bg-[#3b1c26]/60 transition-all cursor-pointer mr-1 pointer-events-auto text-sm font-bold"
            title="Quay lại"
          >
            ←
          </button>
        )}
        {playerCount !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-500/25 px-2.5 py-0.5 rounded shadow-sm">
              <Users className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
              <span>{playerCount} / 12</span>
            </div>
          </div>
        ) : (
          <h2
            className="font-gothic-label text-xs sm:text-sm md:text-base uppercase tracking-widest font-black whitespace-nowrap"
            style={{ color: "#e1c7a5", textShadow: "0 1.5px 4px rgba(0,0,0,0.8)" }}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Middle Center Content */}
      {centerContent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-full max-w-[40%] sm:max-w-[50%] md:max-w-[60%] lg:max-w-[70%]">
          {centerContent}
        </div>
      )}

      {/* Right side: Room Code & Profile */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 select-none">
        {canHostDeclareWolfWin && (
          <button
            type="button"
            onClick={() => setShowWolfWinConfirm(true)}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded bg-red-950/45 border border-red-500/35 hover:bg-red-900/70 hover:border-red-300/60 text-red-200 font-gothic-label tracking-widest text-[8px] sm:text-[10px] font-bold uppercase transition-all shadow-sm pointer-events-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            title="Tuyên bố phe sói thắng"
          >
            Sói thắng
          </button>
        )}

        {gameState?.state === "NIGHT_ACTION" && myRole && roleMeta && (
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3b1c26]/60 border border-[#5a1d2e]/45 hover:bg-[#5a1d2e]/40 hover:border-amber-500/50 text-[#e1c7a5] font-gothic-label tracking-widest text-[9px] sm:text-[10px] font-bold uppercase transition-all shadow-sm pointer-events-auto cursor-pointer"
            title="Xem thẻ bài của tôi"
          >
            Xem Thẻ
          </button>
        )}

        {roomId && (
          <div className="flex items-center">
            <span className="font-gothic-label text-[10px] sm:text-xs uppercase tracking-widest font-black text-[#829ea2]/60 hidden sm:inline">
              ID:
            </span>
            <span className="font-mono font-black text-xs sm:text-sm text-[#e1c7a5] tracking-widest bg-[#3b1c26]/20 border border-[#5a1d2e]/30 px-2.5 py-0.5 rounded shadow-sm">
              {roomId}
            </span>
          </div>
        )}

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#cda372]/30 bg-[#1b1c22]/80 hover:bg-[#252830] hover:border-[#cda372]/60 transition-all cursor-pointer shadow-md group pointer-events-auto shrink-0"
            title="Chỉnh sửa danh tính"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#445257]/50 shrink-0">
              {profileAvatarUrl ? (
                <AvatarDisplay
                  avatarUrl={profileAvatarUrl}
                  name={profileName || "?"}
                  size={24}
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] bg-sky-950 text-sky-400 font-bold font-mono">
                  {(profileName || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-serif italic text-[#e1c7a5] font-bold max-w-20 sm:max-w-30 truncate leading-none">
              {profileName || "Vô danh"}
            </span>
          </button>
        )}
      </div>

      {showWolfWinConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none pointer-events-auto">
          <div className="absolute inset-0" onClick={() => setShowWolfWinConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-red-500/35 bg-[#0b0d11]/95 p-5 text-center shadow-[0_16px_50px_rgba(0,0,0,0.85)]">
            <h3 className="font-gothic-label text-xl uppercase tracking-widest text-red-300">
              Xác nhận sói thắng?
            </h3>
            <p className="mt-3 font-serif text-xs italic leading-relaxed text-[#e1c7a5]/85">
              Hành động này sẽ kết thúc ván ngay lập tức với phần thắng thuộc về phe Sói.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowWolfWinConfirm(false)}
                className="rounded bg-[#222a2f] px-4 py-2 font-serif text-xs font-bold uppercase tracking-wider text-[#829ea2] transition-all hover:bg-[#2f3940] hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWolfWinConfirm(false);
                  hostDeclareWolfWin();
                }}
                className="rounded border border-red-400/50 bg-red-950/70 px-4 py-2 font-serif text-xs font-bold uppercase tracking-wider text-red-100 transition-all hover:bg-red-800"
              >
                Sói thắng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Card Modal */}
      {showCardModal && myRole && roleMeta && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none pointer-events-auto">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setShowCardModal(false)} />
          
          <div 
            className="relative max-w-xs w-full bg-[#111318]/95 border border-[#cda372]/30 rounded-xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-3 right-3 text-[#829ea2] hover:text-white transition-all text-base font-bold cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5"
            >
              ✕
            </button>

            {/* Title */}
            <span className="font-gothic-label text-[9px] uppercase tracking-widest text-amber-500/80 mb-4 block">
              Thẻ Bài Nhân Vật
            </span>

            {/* Circular Avatar / Frame Decor */}
            <div 
              className="relative w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.7)] mb-5 bg-[#222a2f]/60"
              style={{ borderColor: roleMeta.highlightColor || "rgba(130,158,162,0.4)" }}
            >
              <RoleAccessory role={myRole} />
              
              {/* Internal Avatar displaying Role Icon / Emoji */}
              <div 
                className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-3xl font-serif"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
              >
                {roleMeta.icon || "🃏"}
              </div>
            </div>

            {/* Role Name */}
            <h2 
              className="font-gothic-heading text-2xl tracking-wide uppercase font-black mb-2"
              style={{ 
                color: roleMeta.highlightColor,
                textShadow: `0 0 12px ${roleMeta.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`
              }}
            >
              {roleMeta.nameVi}
            </h2>

            {/* Description Box */}
            <p className="bg-[#222a2f]/20 border border-[#445257]/15 rounded-lg p-3.5 text-xs sm:text-sm font-serif leading-relaxed text-[#829ea2] mt-3 w-full text-center">
              {roleMeta.actionDesc}
            </p>

            {/* Confirm button */}
            <button
              onClick={() => setShowCardModal(false)}
              className="mt-6 w-full py-2 bg-linear-to-r from-[#5a1d2e] to-[#3b1c26] hover:from-[#7c253c] hover:to-[#5a1d2e] border border-[#5a1d2e] rounded-lg text-white font-gothic-label tracking-widest text-[11px] font-bold uppercase transition-all shadow-[0_3px_8px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
