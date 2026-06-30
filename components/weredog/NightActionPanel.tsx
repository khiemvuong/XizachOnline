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
  hostTimerSeconds?: number;
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
  hostTimerSeconds,
}: NightActionPanelProps) {
  const display = ROLE_DISPLAY[roleKey];
  const label = confirmLabel ?? display.confirmLabel;

  // ── Spectator / Not My Turn View ──
  if (!isMyTurn) {
    const isSleepRole = roleKey === "Villager" || roleKey === "Elder";
    const headingText = isSleepRole ? display.actionHeading : `ĐANG CHỜ ${display.nameVi.toUpperCase()}...`;

    return (
      <div className="w-full flex flex-col items-center justify-center gap-2 py-2 animate-fade-in text-center max-w-[280px]">
        {/* Large Gothic Heading */}
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-2 text-shadow-maroon"
          style={{ 
            textShadow: `0 0 10px ${display.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
            color: display.highlightColor
          }}
        >
          {isHost ? display.actionHeading : headingText}
        </h1>

        {isHost && onHostConfirm ? (
          <div className="flex flex-col items-center gap-2 mt-1">
            {/* Timer status */}
            <div className="flex items-center gap-1.5 text-[10px] font-gothic-ui uppercase tracking-widest text-[#829ea2]/60 select-none">
              <span>Đếm ngược:</span>
              <span className="font-mono font-bold text-red-400">{hostTimerSeconds ?? 10}s</span>
            </div>

            {/* Large plaque confirm button */}
            <button
              onClick={onHostConfirm}
              className="relative w-[200px] h-[52px] transition-all duration-200 group hover:scale-[1.03] active:scale-95 cursor-pointer mt-1"
            >
              {/* Plaque SVG */}
              <svg
                width="200"
                height="32"
                viewBox="0 0 200 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-[10px] left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
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
                className="absolute left-0 w-[140px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-black uppercase tracking-wider select-none"
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
                  alt="Seal"
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
      <div className="w-full flex flex-col items-center justify-center gap-1.5 animate-fade-in text-center max-w-[280px]">
        {/* Large Gothic Heading */}
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-shadow-maroon"
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
  return (
    <div className="w-full flex flex-col items-center gap-2 animate-fade-in text-center max-w-[280px]">
      {/* Large Gothic Heading */}
      <h1 
        className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-shadow-maroon"
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
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`relative w-[200px] h-[52px] transition-all duration-200 group mt-1.5 ${
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
            className="absolute top-[10px] left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
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
            className="absolute left-0 w-[140px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-bold italic tracking-wider select-none"
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
              alt="Seal"
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
