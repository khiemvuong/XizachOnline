import { type ReactNode } from "react";
import Image from "next/image";
import { AvalonPlayer } from "@/server/game/AvalonTypes";
import { getRoleImageSrcForViewer } from "../roleImage";
import { Skull } from "lucide-react";

export default function FactionPanel({
  label,
  resultTag,
  players,
  me,
  accentClass,
  borderClass,
  icon,
  assassinationTarget,
  muted = false,
  compact = false,
}: {
  label: string;
  resultTag: string;
  players: AvalonPlayer[];
  me: AvalonPlayer;
  accentClass: string;
  borderClass: string;
  icon: ReactNode;
  assassinationTarget?: string | null;
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border backdrop-blur-md bg-surface-container-low/60 ${compact ? "p-3" : "p-4"} ${borderClass} ${muted ? "opacity-75" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`${accentClass} shrink-0`}>{icon}</span>
        <span
          className={`font-headline ${compact ? "text-sm" : "text-base"} uppercase tracking-[0.14em] ${accentClass} ${!muted && accentClass.includes("primary") ? "[text-shadow:0_0_16px_rgba(186,200,220,0.3)]" : !muted && accentClass.includes("tertiary") ? "[text-shadow:0_0_16px_rgba(255,180,168,0.3)]" : ""}`}
        >
          {label}
        </span>
        <span className="h-px grow bg-current opacity-10"></span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] ${resultTag === "WINNER"
              ? `${accentClass} border-current/40 bg-current/10`
              : "text-on-surface-variant border-outline-variant/40 bg-surface-container/40"
            }`}
        >
          {resultTag}
        </span>
      </div>

      {/* Player rows */}
      <div
        className={`grid ${compact ? "grid-cols-1 gap-1.5" : "grid-cols-2 gap-2"}`}
      >
        {players.map((player) => {
          const isTarget = player.userId === assassinationTarget;
          const isSelf = player.userId === me.userId;
          return (
            <div
              key={player.userId}
              className={`flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/40 ${compact ? "p-2" : "p-2.5"}`}
            >
              <div
                className={`relative ${compact ? "h-7 w-7" : "h-9 w-9"} overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-low shrink-0`}
              >
                <Image
                  src={getRoleImageSrcForViewer(player, me)}
                  alt={player.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate ${compact ? "text-xs" : "text-sm"} font-bold text-on-surface leading-tight`}
                >
                  {player.name}
                  {isSelf ? " (Bạn)" : ""}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] uppercase tracking-[0.14em] ${muted ? "text-on-surface-variant/70" : accentClass}`}
                  >
                    {player.role ? player.role.replace("_", " ") : "Unknown"}
                  </span>
                  {isTarget && <Skull className="h-3 w-3 text-tertiary" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
