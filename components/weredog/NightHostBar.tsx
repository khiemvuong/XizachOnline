"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ROLE_DISPLAY, type WeredogRoleName } from "./nightConstants";

interface NightHostBarProps {
  currentRole: WeredogRoleName;
  onConfirm: () => void;
  nightNumber: number;
  roleIndex: number;
  totalRoles: number;
  autoConfirmSeconds?: number;
}

export default function NightHostBar({
  currentRole,
  onConfirm,
  nightNumber,
  roleIndex,
  totalRoles,
  autoConfirmSeconds = 10,
}: NightHostBarProps) {
  const [timeLeft, setTimeLeft] = useState(autoConfirmSeconds);
  const display = ROLE_DISPLAY[currentRole];
  const progress = ((roleIndex + 1) / totalRoles) * 100;

  // Reset timer when role changes
  useEffect(() => {
    setTimeLeft(autoConfirmSeconds);
  }, [currentRole, autoConfirmSeconds]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onConfirm();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onConfirm]);

  const handleConfirm = useCallback(() => {
    setTimeLeft(0);
    onConfirm();
  }, [onConfirm]);

  return (
    <div className="w-full bg-[#0b0d11]/90 border-t border-[#445257]/30 px-4 py-2 flex items-center justify-between gap-3 font-gothic-ui text-[10px] sm:text-[11px] select-none z-30">
      {/* Left: Night info + role progress */}
      <div className="flex items-center gap-3">
        <span className="text-[#829ea2]/50 uppercase tracking-widest font-bold">
          Đêm {nightNumber}
        </span>
        <div className="h-3 w-px bg-[#445257]/30" />
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{display.icon}</span>
          <span className="uppercase tracking-wider font-bold" style={{ color: display.highlightColor }}>
            {display.nameVi}
          </span>
          <span className="text-[#445257] font-mono">
            ({roleIndex + 1}/{totalRoles})
          </span>
        </div>
      </div>

      {/* Center: Progress bar */}
      <div className="flex-1 max-w-[200px] h-1 bg-[#445257]/20 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: display.highlightColor,
            opacity: 0.7,
          }}
        />
      </div>

      {/* Right: Timer + Confirm button */}
      <div className="flex items-center gap-2">
        {/* Auto-confirm timer */}
        <div className="flex items-center gap-1">
          <div
            className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-colors"
            style={{
              borderColor: timeLeft <= 3 ? "#dc2626" : "#445257",
              color: timeLeft <= 3 ? "#dc2626" : "#829ea2",
            }}
          >
            {timeLeft}
          </div>
          <span className="text-[#445257] text-[9px] uppercase tracking-widest hidden sm:inline">
            Auto
          </span>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="px-3 py-1.5 bg-[#3b1c26] hover:bg-[#551c2e] border border-[#5a1d2e] rounded text-[10px] uppercase tracking-wider font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          style={{ color: display.highlightColor }}
        >
          Xác Nhận
        </button>
      </div>
    </div>
  );
}
