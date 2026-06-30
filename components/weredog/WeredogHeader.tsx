"use client";

import { ReactNode } from "react";
import { Users } from "lucide-react";

interface WeredogHeaderProps {
  roomId?: string;
  title?: string;
  playerCount?: number;
  centerContent?: ReactNode;
}

export default function WeredogHeader({
  roomId,
  title,
  playerCount,
  centerContent,
}: WeredogHeaderProps) {
  return (
    <div className="w-full bg-[#0b0d11]/85 border-b border-[#445257]/20 px-6 h-12 sm:h-14 md:h-16 flex items-center justify-between relative select-none z-20">
      {/* Left side content */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2">
        {playerCount !== undefined ? (
          <div className="flex items-center gap-2">
            <span className="font-gothic-label text-xs sm:text-sm uppercase tracking-widest font-black text-[#829ea2]/60 hidden sm:inline">
              Số người chơi:
            </span>
            <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-500/25 px-2.5 py-0.5 rounded shadow-sm">
              <Users className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
              <span>{playerCount} / 12</span>
            </div>
          </div>
        ) : (
          <h2
            className="font-gothic-label text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl uppercase tracking-widest font-black whitespace-nowrap"
            style={{ color: "#e1c7a5", textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Middle Center Content */}
      {centerContent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center max-w-[55%]">
          {centerContent}
        </div>
      )}

      {/* Right side: Room Code */}
      {roomId && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
          <span className="font-gothic-label text-[10px] sm:text-xs uppercase tracking-widest font-black text-[#829ea2]/60 hidden sm:inline">
            Phòng:
          </span>
          <span className="font-mono font-black text-xs sm:text-sm text-[#e1c7a5] tracking-widest bg-[#3b1c26]/20 border border-[#5a1d2e]/30 px-2.5 py-0.5 rounded shadow-sm">
            {roomId}
          </span>
        </div>
      )}
    </div>
  );
}
