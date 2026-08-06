"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { ROLE_DISPLAY, type WeredogRoleName } from "./nightConstants";

interface NightActionPanelProps {
  roleKey: WeredogRoleName;
  isMyTurn: boolean;
  hasActed: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  children?: ReactNode;
  isHost?: boolean;
  onHostConfirm?: () => void;
  hasRoleActed?: boolean;
  hostActionSummary?: string;
  onWolfRevote?: () => void;
  isActiveRoleDead?: boolean;
  isElderDead?: boolean;
}

export default function NightActionPanel({
  roleKey,
  isMyTurn,
  hasActed,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
  children,
  isHost = false,
  onHostConfirm,
  hasRoleActed = false,
  hostActionSummary,
  onWolfRevote,
  isActiveRoleDead = false,
  isElderDead = false,
}: NightActionPanelProps) {
  const display = ROLE_DISPLAY[roleKey];
  const label = confirmLabel ?? display.confirmLabel;

  // ── Spectator / Not My Turn View ──
  if (!isMyTurn) {
    const isSleepRole = roleKey === "Villager" || roleKey === "Elder";
    const headingText = isSleepRole ? display.actionHeading : `CHỜ ${display.nameVi.toUpperCase()}...`;

    return (
      <div className="w-full flex flex-col items-center justify-center py-2 animate-fade-in text-center max-w-70">
        {/* Large Gothic Heading */}
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon"
          style={{ 
            textShadow: `0 0 10px ${display.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
            color: display.highlightColor
          }}
        >
          {isHost ? display.actionHeading : headingText}
        </h1>

        {isHost && onHostConfirm ? (
          <div className="flex flex-col items-center gap-2">
            {/* Host Action Summary Log */}
            {hostActionSummary && (
              <div className="bg-[#1b1c22]/90 border border-[#cda372]/30 rounded-lg px-3 py-1.5 max-w-65 text-center shadow-[0_4px_12px_rgba(0,0,0,0.6)] animate-fade-in mb-1">
                <span className="font-serif italic text-xs text-[#e1c7a5] font-bold block leading-relaxed">
                  {hostActionSummary}
                </span>
              </div>
            )}

            {/* Untimed phases wait for an explicit moderator action. */}
            <div className="flex items-center gap-1.5 text-[10px] font-serif uppercase tracking-widest text-[#829ea2]/60 select-none">
              {hasRoleActed ? (
                isActiveRoleDead ? (
                  <span className="text-red-400 font-bold animate-pulse">⚠️ VAI TRÒ NÀY ĐÃ CHẾT! TỰ ĐỘNG BỎ QUA...</span>
                ) : isElderDead && roleKey !== "Wolf" ? (
                  <span className="text-red-400 font-bold animate-pulse text-center">⚠️ GIÀ LÀNG ĐÃ CHẾT! VAI TRÒ NÀY MẤT CHỨC NĂNG. TỰ ĐỘNG BỎ QUA...</span>
                ) : roleKey === "Wolf" && hostActionSummary?.includes("Bất đồng") ? (
                  <span className="text-amber-400 font-bold">⚠️ Hòa phiếu! Quản trò hãy quyết định</span>
                ) : (
                  <span>Đã sẵn sàng — chờ quản trò xác nhận</span>
                )
              ) : (
                <span className="text-amber-500 font-bold">⏳ Đang chờ người chơi chọn...</span>
              )}
            </div>

            {onWolfRevote && roleKey === "Wolf" && hostActionSummary?.includes("Bất đồng") && (
              <button
                type="button"
                onClick={onWolfRevote}
                className="px-4 py-1.5 rounded-full border border-amber-500/80 bg-[#1b1c22]/90 hover:bg-amber-500/20 text-amber-300 hover:text-white text-[10px] font-serif font-bold uppercase tracking-wider transition-[background-color,color,box-shadow,transform] cursor-pointer mt-1 mb-2 shadow-[0_2px_8px_rgba(245,158,11,0.2)] pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d11]"
              >
                🔄 Yêu Cầu Sói Vote Lại
              </button>
            )}

            {/* Large plaque confirm button */}
            <button
              type="button"
              onClick={onHostConfirm}
              disabled={!hasRoleActed}
              className={`relative w-50 h-13 transition-[opacity,transform] duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d11] ${
                hasRoleActed ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "opacity-40 cursor-not-allowed"
              }`}
            >
              {/* Plaque SVG */}
              <svg
                width="200"
                height="32"
                viewBox="0 0 200 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-2.5 left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
              >
                <defs>
                  <linearGradient id={`plaqueNight-Host-${roleKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d1b28" />
                    <stop offset="100%" stopColor="#250d14" />
                  </linearGradient>
                </defs>
                <path
                  d="M 12 2 L 188 2 L 194 8 L 194 10 L 200 16 L 194 22 L 194 24 L 188 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z"
                  fill={`url(#plaqueNight-Host-${roleKey})`}
                  stroke={display.highlightColor}
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
                <path
                  d="M 13 4 L 187 4 L 192 9 L 192 11 L 197 16 L 192 21 L 192 23 L 187 28 L 13 28 L 8 23 L 8 21 L 3 16 L 8 11 L 8 9 Z"
                  stroke={display.highlightColor}
                  strokeWidth="0.5"
                  strokeOpacity="0.4"
                  fill="none"
                />
              </svg>

              {/* Button label */}
              <span
                className="absolute left-0 w-35 text-center top-6.5 -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-black uppercase tracking-wider select-none"
                style={{ color: display.highlightColor, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                XÁC NHẬN
              </span>

              {/* Wax seal */}
              <div
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)]"
              >
                <Image
                  src="/werewolf/logo.png"
                  alt=""
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        ) : (
          !isSleepRole && (
            <div className="flex gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )
        )}
      </div>
    );
  }

  // ── Already Acted View ──
  if (hasActed) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-1.5 animate-fade-in text-center max-w-70">
        {/* Large Gothic Heading */}
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon"
          style={{ 
            textShadow: `0 0 10px ${display.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
            color: display.highlightColor
          }}
        >
          ĐÃ HOÀN THÀNH
        </h1>

        <p className="font-gothic-body text-[#829ea2]/80 text-[10px] sm:text-xs italic leading-tight">
          Đang chờ quản trò xác nhận...
        </p>
        {children}
      </div>
    );
  }

  // ── Active Turn View ──
  if (isElderDead && roleKey !== "Wolf") {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-2 animate-fade-in text-center max-w-70">
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon text-red-500"
          style={{ 
            textShadow: "0 0 10px rgba(239,68,68,0.35), 0 2px 4px rgba(0,0,0,0.9)",
          }}
        >
          {display.actionHeading}
        </h1>

        <div className="bg-red-950/40 border border-red-500/25 rounded-lg p-3 text-red-400 text-xs sm:text-sm font-serif leading-relaxed mt-2 shadow-md">
          ⚠️ GIÀ LÀNG ĐÃ CHẾT! Bạn đã mất đi sức mạnh chức năng đêm nay.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center animate-fade-in text-center max-w-70">
      {/* Large Gothic Heading */}
      <h1 
        className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon"
        style={{ 
          textShadow: `0 0 10px ${display.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
          color: display.highlightColor
        }}
      >
        {display.actionHeading}
      </h1>

      {/* Role-specific children (vote status, potion buttons, etc.) */}
      {children}

      {/* Confirm button — Gothic plaque style */}
      {onConfirm && label && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`relative w-50 h-13 transition-[opacity,transform] duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d11] ${
            confirmDisabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:scale-[1.03] active:scale-95 cursor-pointer"
          }`}
        >
          {/* Plaque SVG */}
          <svg
            width="200"
            height="32"
            viewBox="0 0 200 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-2.5 left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
          >
            <defs>
              <linearGradient id={`plaqueNight-${roleKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d1b28" />
                <stop offset="100%" stopColor="#250d14" />
              </linearGradient>
            </defs>
            <path
              d="M 12 2 L 188 2 L 194 8 L 194 10 L 200 16 L 194 22 L 194 24 L 188 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z"
              fill={`url(#plaqueNight-${roleKey})`}
              stroke={display.highlightColor}
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <path
              d="M 13 4 L 187 4 L 192 9 L 192 11 L 197 16 L 192 21 L 192 23 L 187 28 L 13 28 L 8 23 L 8 21 L 3 16 L 8 11 L 8 9 Z"
              stroke={display.highlightColor}
              strokeWidth="0.5"
              strokeOpacity="0.4"
              fill="none"
            />
          </svg>

          {/* Button label */}
          <span
            className="absolute left-0 w-35 text-center top-6.5 -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-bold italic tracking-wider select-none"
            style={{ color: display.highlightColor, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {label}
          </span>

          {/* Wax seal */}
          <div
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)]"
          >
            <Image
              src="/werewolf/logo.png"
              alt=""
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      )}
    </div>
  );
}
