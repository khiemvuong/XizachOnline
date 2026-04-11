import { type ReactNode } from "react";
import { type AvalonRoom, type AvalonPlayer } from "@/server/game/AvalonTypes";
import FactionPanel from "./FactionPanel";
import { type GameOverTheme } from "./gameoverTypes";

export default function VictoryScene({
  t,
  goodWon,
  winnerLabel,
  loserLabel,
  winnerPlayers,
  loserPlayers,
  me,
  gameState,
  actionButton,
}: {
  t: GameOverTheme;
  goodWon: boolean;
  winnerLabel: string;
  loserLabel: string;
  winnerPlayers: AvalonPlayer[];
  loserPlayers: AvalonPlayer[];
  me: AvalonPlayer;
  gameState: AvalonRoom;
  actionButton: ReactNode;
}) {
  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 items-center px-8">
      {/* ─── LEFT: Victory Announcement (5 cols) ─── */}
      <div className="col-span-5 flex flex-col gap-4 items-start">
        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <span className="h-px w-12 bg-current opacity-40"></span>
          <span
            className={`font-label ${t.accentColor} tracking-[0.5em] uppercase text-xs font-black opacity-90`}
          >
            {t.eyebrow}
          </span>
        </div>

        {/* "Victory" sub-heading */}
        <h3
          className={`font-headline text-2xl font-bold tracking-widest uppercase -mb-2.5 ${t.victoryWordColor}`}
        >
          {t.victoryWord}
        </h3>

        {/* BIG TITLE — gold shimmer for good, intense red glow for evil */}
        <h2
          className={`font-headline text-7xl font-black tracking-tighter leading-none italic uppercase ${
            t.goldShimmer
              ? "[text-shadow:0_0_20px_rgba(255,215,0,0.8),0_0_45px_rgba(255,215,0,0.6),0_0_80px_rgba(255,215,0,0.3)] brightness-125"
              : "text-[#ff3131] [text-shadow:0_0_20px_rgba(255,49,49,0.8),0_0_45px_rgba(255,49,49,0.6),0_0_80px_rgba(255,49,49,0.3)] brightness-125"
          }`}
          style={
            t.goldShimmer
              ? {
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #FFF8DC 50%, #FFD700 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))",
                }
              : undefined
          }
        >
          {t.title}
        </h2>

        {/* Italic quote */}
        <p
          className={`max-w-md text-lg text-on-surface-variant font-serif italic leading-relaxed border-l-2 ${
            t.accentColor === "text-primary"
              ? "border-primary/30 bg-primary/5"
              : "border-tertiary/30 bg-tertiary/5"
          } pl-6 py-2 rounded-r-xl mt-2`}
        >
          {t.quote}
        </p>

        {/* Action */}
        <div className="mt-2">{actionButton}</div>
      </div>

      {/* ─── RIGHT: Player Panels (7 cols) ─── */}
      <div className="col-span-7 flex flex-col gap-4 h-full justify-center overflow-hidden">
        <div className="flex items-center gap-4">
          <span
            className={`font-headline ${t.winAccent} tracking-[0.4em] uppercase text-xs font-bold whitespace-nowrap`}
          >
            {goodWon ? "Loyal Knights" : "The Traitors' Circle"}
          </span>
          <span
            className={`h-px grow bg-linear-to-r ${
              t.winAccent === "text-primary"
                ? "from-primary/60"
                : "from-tertiary/60"
            } to-transparent`}
          ></span>
        </div>

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
    </div>
  );
}
