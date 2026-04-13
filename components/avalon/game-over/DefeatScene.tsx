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

      {/* 2-Column Grid: left+right symmetric layout */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-[1100px] mt-6 items-start">
        {/* Left: Winner faction */}
        <FactionPanel
          label={winnerLabel}
          resultTag="WINNER"
          players={winnerPlayers}
          me={me}
          accentClass={t.winAccent}
          borderClass={t.winPanelBorder}
          icon={t.winIcon}
          assassinationTarget={gameState.assassinationTarget}
        />

        {/* Right: Loser faction */}
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
        />
      </div>

      {/* Action */}
      <div className="mt-5">{actionButton}</div>
    </div>
  );
}
