import { type ReactNode } from "react";
import { type AvalonRoom, type AvalonPlayer } from "@/server/game/AvalonTypes";
import FactionPanel from "./FactionPanel";
import { type GameOverTheme } from "./gameoverTypes";

export default function DefeatScene({
  t,
  winnerLabel,
  loserLabel,
  winnerPlayers,
  loserPlayers,
  me,
  gameState,
  actionButton,
}: {
  t: GameOverTheme;
  winnerLabel: string;
  loserLabel: string;
  winnerPlayers: AvalonPlayer[];
  loserPlayers: AvalonPlayer[];
  me: AvalonPlayer;
  gameState: AvalonRoom;
  actionButton: ReactNode;
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-8">
      {/* Center icon circle */}
      <div
        className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center backdrop-blur-sm border ${t.iconBg}`}
      >
        {t.centerIcon}
      </div>

      {/* Big title */}
      <h1
        className={`font-headline text-5xl tracking-tight text-on-surface-variant text-center opacity-90 leading-none`}
      >
        {t.title}
      </h1>
      <p
        className={`font-label uppercase tracking-[0.4em] text-sm mt-3 opacity-60 ${t.subColor}`}
      >
        {t.sub}
      </p>

      {/* Bento grid: players left+right, dominant center */}
      <div className="grid grid-cols-12 gap-4 w-full max-w-[1100px] mt-6">
        {/* Left: Winner faction */}
        <div className="col-span-4">
          <FactionPanel
            label={winnerLabel}
            resultTag="WINNER"
            players={winnerPlayers}
            me={me}
            accentClass={t.winAccent}
            borderClass={t.winPanelBorder}
            icon={t.winIcon}
            assassinationTarget={gameState.assassinationTarget}
            compact
          />
        </div>

        {/* Center: Dominant Faction info */}
        <div
          className={`col-span-4 p-5 rounded-xl backdrop-blur-xl border flex flex-col items-center justify-center text-center ${t.dominantBorder}`}
        >
          <span
            className={`font-label text-[10px] font-extrabold uppercase tracking-[0.3em] mb-3 ${t.dominantAccent}`}
          >
            Dominant Faction
          </span>
          <h3 className={`font-headline text-2xl mb-3 ${t.dominantAccent}`}>
            {t.dominantLabel}
          </h3>
          <p className="font-body text-on-surface-variant text-xs max-w-xs leading-relaxed">
            {t.dominantDesc}
          </p>
          <div className="mt-4 flex gap-2">
            <div
              className={`h-1 w-12 ${
                t.dominantAccent === "text-tertiary"
                  ? "bg-tertiary"
                  : t.dominantAccent === "text-primary"
                  ? "bg-primary"
                  : "bg-on-surface-variant/30"
              }`}
            ></div>
            <div
              className={`h-1 w-2 ${
                t.dominantAccent === "text-tertiary"
                  ? "bg-tertiary/30"
                  : t.dominantAccent === "text-primary"
                  ? "bg-primary/30"
                  : "bg-on-surface-variant/15"
              }`}
            ></div>
            <div
              className={`h-1 w-2 ${
                t.dominantAccent === "text-tertiary"
                  ? "bg-tertiary/30"
                  : t.dominantAccent === "text-primary"
                  ? "bg-primary/30"
                  : "bg-on-surface-variant/15"
              }`}
            ></div>
          </div>
        </div>

        {/* Right: Loser faction */}
        <div className="col-span-4">
          <FactionPanel
            label={loserLabel}
            resultTag="DEFEATED"
            players={loserPlayers}
            me={me}
            accentClass={t.loseAccent}
            borderClass={t.losePanelBorder}
            icon={t.loseIcon}
            assassinationTarget={gameState.assassinationTarget}
            muted
            compact
          />
        </div>
      </div>

      {/* Action */}
      <div className="mt-5">{actionButton}</div>
    </div>
  );
}
