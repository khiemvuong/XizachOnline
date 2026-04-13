import { type ReactNode } from "react";
import Image from "next/image";
import { AvalonPlayer } from "@/server/game/AvalonTypes";
import { getRoleImageSrcForViewer } from "../roleImage";
import { Skull } from "lucide-react";

// Priority order for display: key roles first, then minions
const ROLE_SORT_PRIORITY: Record<string, number> = {
  Merlin: 0,
  Percival: 1,
  Arthur: 2,
  "Good Lancelot": 3,
  "Evil Lancelot": 4,
  Assassin: 5,
  Morgana: 6,
  Mordred: 7,
  Oberon: 8,
  Minion_Good: 9,
  Minion_Evil: 10,
};

function sortPlayers(players: AvalonPlayer[]): AvalonPlayer[] {
  return [...players].sort((a, b) => {
    const pa = ROLE_SORT_PRIORITY[a.role ?? ""] ?? 99;
    const pb = ROLE_SORT_PRIORITY[b.role ?? ""] ?? 99;
    return pa - pb;
  });
}

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
  const sorted = sortPlayers(players);

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

      {/* Player rows — sorted by role priority */}
      <div
        className={`grid ${compact ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"}`}
      >
        {sorted.map((player) => {
          const isTarget = player.userId === assassinationTarget;
          const isSelf = player.userId === me.userId;
          return (
            <div
              key={player.userId}
              className={`relative flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/40 overflow-hidden ${compact ? "p-2.5" : "p-3"}`}
            >
              {/* Role image avatar */}
              <div
                className={`relative ${compact ? "h-10 w-10" : "h-12 w-12"} overflow-hidden rounded-full border shrink-0 ${
                  isTarget
                    ? "border-red-600/70 ring-1 ring-red-600/40"
                    : "border-outline-variant/30 text-shadow-sm shadow-black/50"
                } bg-surface-container shadow-inner`}
              >
                <Image
                  src={getRoleImageSrcForViewer(player, me)}
                  alt={player.name}
                  fill
                  sizes="48px"
                  className={`object-cover ${isTarget ? "grayscale brightness-50" : ""}`}
                />
              </div>

              {/* Name + role */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate ${compact ? "text-sm" : "text-base"} font-black tracking-wide leading-tight mb-0.5 ${
                    isTarget ? "text-red-500/80 line-through decoration-2 decoration-red-600" : "text-on-surface"
                  }`}
                  style={{ textShadow: isTarget ? "none" : "0 2px 4px rgba(0,0,0,0.3)" }}
                >
                  {player.name}
                  {isSelf && <span className="text-secondary/80 font-normal ml-1">(Bạn)</span>}
                </p>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] ${muted ? "text-on-surface-variant/70" : accentClass}`}
                >
                  {player.role ? player.role.replace("_", " ") : "Unknown"}
                </span>
              </div>

              {/* Blood-red assassinated overlay — diagonal slash */}
              {isTarget && (
                <>
                  {/* Full-width diagonal red line */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1="0" y1="0"
                        x2="100%" y2="100%"
                        stroke="rgba(185,28,28,0.65)"
                        strokeWidth="3.5"
                      />
                      <line
                        x1="100%" y1="0"
                        x2="0" y2="100%"
                        stroke="rgba(185,28,28,0.45)"
                        strokeWidth="3.5"
                      />
                    </svg>
                    {/* Blood red tint overlay */}
                    <div className="absolute inset-0 bg-red-950/25 rounded-lg" />
                  </div>

                  {/* Eliminated badge top-right */}
                  <div className="absolute top-1 right-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-red-500/80">
                    <Skull className="h-3 w-3 text-tertiary" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
