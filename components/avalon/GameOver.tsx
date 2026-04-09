"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
import Image from "next/image";
import {
  type ReactNode,
  type RefObject,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Skull,
  HeartCrack,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getRoleImageSrcForViewer } from "./roleImage";

// ── Background images from Template2 ──────────────────────────────────────────
const BG_EVIL_WIN = "/game_over_bg/evil_win.png";
const BG_GOOD_WIN = "/game_over_bg/good_win.png";
const BG_DEFEAT_LOYAL = "/game_over_bg/defeat_loyal.png";
const BG_DEFEAT_TRAITOR = "/game_over_bg/defeat_traitor.png";

// ── Scene dimensions ──────────────────────────────────────────────────────────
const SCENE_W = 1200;
const SCENE_H = 640;

// === Main GameOver Component ===
export default function GameOver({
  gameState,
  me,
  socket,
  winAudioRef,
  loseAudioRef,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
  winAudioRef?: RefObject<HTMLAudioElement | null>;
  loseAudioRef?: RefObject<HTMLAudioElement | null>;
}) {
  const isHost = me.isHost;
  const myTeam = me.team;
  const goodWon = gameState.winner === "Good";
  const isAbandoned = gameState.winner === "Abandoned";
  const didMyTeamWin = !isAbandoned && !!myTeam && myTeam === gameState.winner;

  // 4 personal cases
  const personalCase = isAbandoned
    ? "abandoned"
    : myTeam === "Good" && didMyTeamWin
      ? "good-win"
      : myTeam === "Good" && !didMyTeamWin
        ? "good-lose"
        : myTeam === "Evil" && didMyTeamWin
          ? "evil-win"
          : "evil-lose";

  const isVictory = personalCase === "good-win" || personalCase === "evil-win";
  const isDefeat = personalCase === "good-lose" || personalCase === "evil-lose";

  // === Audio toggle — directly control the refs from AvalonBoard ===
  const [isGameOverAudioEnabled, setIsGameOverAudioEnabled] = useState(true);
  useEffect(() => {
    const shouldMute = !isGameOverAudioEnabled;
    if (winAudioRef?.current) winAudioRef.current.muted = shouldMute;
    if (loseAudioRef?.current) loseAudioRef.current.muted = shouldMute;
  }, [isGameOverAudioEnabled, winAudioRef, loseAudioRef]);

  // === Scale logic ===
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      if (!viewportRef.current) return;
      const r = viewportRef.current.getBoundingClientRect();
      const aw = Math.max(280, r.width - 16);
      const ah = Math.max(200, r.height - 16);
      setScale(Math.max(0.28, Math.min(1, aw / SCENE_W, ah / SCENE_H)));
    };
    compute();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(compute)
        : null;
    if (ro && viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  // Split players by team
  const goodPlayers = gameState.players.filter((p) => p.team === "Good");
  const evilPlayers = gameState.players.filter((p) => p.team === "Evil");
  const winnerLabel = goodWon
    ? "Loyal Servants of Arthur"
    : "Minions of Mordred";
  const loserLabel = goodWon
    ? "Minions of Mordred"
    : "Loyal Servants of Arthur";
  const winnerPlayers = goodWon ? goodPlayers : evilPlayers;
  const loserPlayers = goodWon ? evilPlayers : goodPlayers;

  // Quest stats - restore using correct property name
  // const questSuccessCount = gameState.questHistory?.filter(q => q.status === 'success').length ?? 0;
  // const questFailCount = gameState.questHistory?.filter(q => q.status === 'fail').length ?? 0;

  // Theme config per case
  const themes = {
    "good-win": {
      bg: BG_GOOD_WIN,
      bgMix: "mix-blend-screen opacity-60",
      overlayTint: "bg-blue-900/10",
      eyebrow: "Triumph of the Light",
      victoryWord: "Victory",
      title: "LIGHT PREVAILS",
      goldShimmer: true,
      quote:
        '"The shadows have been cast aside. By your loyalty and the clarity of your purpose, Camelot stands eternal under the gaze of the righteous."',
      accentColor: "text-primary",
      victoryWordColor: "text-primary/80",
      winIcon: <ShieldCheck className="h-4 w-4" />,
      loseIcon: <ShieldAlert className="h-4 w-4" />,
      winAccent: "text-primary",
      loseAccent: "text-tertiary",
      winPanelBorder: "border-primary/40 ring-2 ring-primary/30",
      losePanelBorder: "border-tertiary/25 opacity-70",
    },
    "evil-win": {
      bg: BG_EVIL_WIN,
      bgMix: "mix-blend-multiply opacity-50",
      overlayTint: "bg-red-950/20 mix-blend-color",
      eyebrow: "The Dark Council",
      victoryWord: "Victory",
      title: "DARKNESS TRIUMPHS",
      goldShimmer: false,
      quote:
        '"The Minions of Mordred have corrupted the court. Camelot falls into shadow as the true masters emerge."',
      accentColor: "text-tertiary",
      victoryWordColor: "text-tertiary/80",
      winIcon: <Skull className="h-4 w-4" />,
      loseIcon: <ShieldCheck className="h-4 w-4" />,
      winAccent: "text-tertiary",
      loseAccent: "text-primary",
      winPanelBorder: "border-tertiary/40 ring-2 ring-tertiary/30",
      losePanelBorder: "border-primary/25 opacity-70",
    },
    "good-lose": {
      bg: BG_DEFEAT_LOYAL,
      bgMix: "grayscale-[0.5] opacity-40 contrast-125",
      overlayTint: "",
      centerIcon: <HeartCrack className="text-tertiary w-12 h-12" />,
      iconBg:
        "bg-tertiary-container/30 border-outline-variant/20 shadow-[0_0_30px_rgba(255,180,168,0.2)]",
      title: "CAMELOT FALLS",
      sub: "The darkness claims the realm",
      accentColor: "text-tertiary",
      subColor: "text-secondary",
      dominantLabel: "Minions of Mordred",
      dominantDesc:
        "The ritual of sabotage was completed successfully. Arthur's vision fades into legend.",
      dominantAccent: "text-tertiary",
      dominantBorder: "bg-tertiary-container/20 border-tertiary/20",
      winAccent: "text-tertiary",
      loseAccent: "text-primary",
      winPanelBorder: "border-tertiary/30",
      losePanelBorder: "border-primary/25 opacity-70",
      winIcon: <Skull className="h-4 w-4" />,
      loseIcon: <ShieldCheck className="h-4 w-4" />,
    },
    "evil-lose": {
      bg: BG_DEFEAT_TRAITOR,
      bgMix: "opacity-40",
      overlayTint: "",
      centerIcon: <HeartCrack className="text-primary w-12 h-12" />,
      iconBg:
        "bg-primary-container/30 border-primary/20 shadow-[0_0_30px_rgba(186,200,220,0.2)]",
      title: "BANISHED TO SHADOWS",
      sub: "The Light of Arthur has prevailed",
      accentColor: "text-primary",
      subColor: "text-primary",
      dominantLabel: "Loyal Servants of Arthur",
      dominantDesc:
        "The web of lies was unraveled. The traitors are cast out, and the Round Table stands united once more.",
      dominantAccent: "text-primary",
      dominantBorder: "bg-primary-container/20 border-primary/20",
      winAccent: "text-primary",
      loseAccent: "text-tertiary",
      winPanelBorder: "border-primary/30",
      losePanelBorder: "border-tertiary/25 opacity-70",
      winIcon: <ShieldCheck className="h-4 w-4" />,
      loseIcon: <Skull className="h-4 w-4" />,
    },
    abandoned: {
      bg: BG_DEFEAT_LOYAL,
      bgMix: "grayscale opacity-30",
      overlayTint: "",
      centerIcon: <HeartCrack className="text-on-surface-variant w-12 h-12" />,
      iconBg: "bg-surface-container/40 border-outline-variant/20",
      title: "THE TABLE FALLS SILENT",
      sub: "The round ends before either side can claim the crown",
      accentColor: "text-on-surface-variant",
      subColor: "text-secondary",
      dominantLabel: "No Dominant Faction",
      dominantDesc:
        "The match was abandoned before the prophecy could be fulfilled.",
      dominantAccent: "text-on-surface-variant",
      dominantBorder: "bg-surface-container/20 border-outline-variant/20",
      winAccent: "text-primary",
      loseAccent: "text-tertiary",
      winPanelBorder: "border-outline-variant/30",
      losePanelBorder: "border-outline-variant/30 opacity-70",
      winIcon: <ShieldCheck className="h-4 w-4" />,
      loseIcon: <Skull className="h-4 w-4" />,
    },
  } as const;

  const t = themes[personalCase];

  // Action button
  const actionButton = isHost ? (
    <button
      className={`inline-flex items-center gap-3 rounded-xl px-8 py-3.5 text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${personalCase === "evil-win" || personalCase === "good-lose"
          ? "bg-tertiary text-white shadow-[0_0_20px_rgba(255,49,49,0.4)]"
          : "bg-primary text-on-primary shadow-[0_0_30px_rgba(186,200,220,0.3)] ring-2 ring-primary/50"
        }`}
      onClick={() => socket?.emit("restartAvalonGame")}
    >
      <RefreshCw className="h-4 w-4" />
      Play Again
    </button>
  ) : (
    <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant/80">
      Chờ chủ phòng bắt đầu ván mới...
    </p>
  );

  return (
    <div className="avalon-gameover-shell fixed inset-0 z-100 overflow-hidden animate-in fade-in duration-700">
      {/* === Cinematic Background === */}
      <div className="absolute inset-0 z-0">
        <Image
          src={t.bg}
          alt=""
          fill
          sizes="100vw"
          priority
          unoptimized
          className={`object-cover ${t.bgMix}`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-black/80"></div>
        {t.overlayTint && (
          <div className={`absolute inset-0 ${t.overlayTint}`}></div>
        )}
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{ boxShadow: "inset 0 0 150px 50px rgba(0,0,0,0.9)" }}
        ></div>
        {/* Flicker for evil win */}
        {personalCase === "evil-win" && (
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-red-900/10 to-transparent animate-pulse opacity-50"></div>
        )}
      </div>

      {/* Audio toggle */}
      <button
        onClick={() => setIsGameOverAudioEnabled((prev) => !prev)}
        className="fixed top-4 right-4 z-110 p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all shadow-lg cursor-pointer"
      >
        {isGameOverAudioEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {/* === Scaled viewport === */}
      <div ref={viewportRef} className="relative w-full h-full z-10">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${SCENE_W}px`,
            height: `${SCENE_H}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              VICTORY LAYOUT (good-win / evil-win)
              Inspired by ScreenGoodWin + ScreenEvilWin
             ═══════════════════════════════════════════════════════════════════ */}
          {isVictory && "eyebrow" in t && (
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
                  className={`font-headline text-2xl font-bold tracking-widest uppercase mb-[-10px] ${t.victoryWordColor}`}
                >
                  {t.victoryWord}
                </h3>

                {/* BIG TITLE — gold shimmer for good, intense red glow for evil */}
                <h2
                  className={`font-headline text-7xl font-black tracking-tighter leading-none italic uppercase ${t.goldShimmer
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
                        filter:
                          "drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))",
                      }
                      : undefined
                  }
                >
                  {t.title}
                </h2>

                {/* Italic quote — like ScreenGoodWin */}
                <p
                  className={`max-w-md text-lg ${t.accentColor === "text-primary" ? "text-on-surface-variant" : "text-on-surface-variant"} font-serif italic leading-relaxed border-l-2 ${t.accentColor === "text-primary" ? "border-primary/30 bg-primary/5" : "border-tertiary/30 bg-tertiary/5"} pl-6 py-2 rounded-r-xl mt-2`}
                >
                  {t.quote}
                </p>

                {/* Action */}
                <div className="mt-2">{actionButton}</div>
              </div>

              {/* ─── RIGHT: Player Panels (7 cols) ─── */}
              <div className="col-span-7 flex flex-col gap-4 h-full justify-center overflow-hidden">
                {/* Section header like Template2 */}
                <div className="flex items-center gap-4">
                  <span
                    className={`font-headline ${t.winAccent} tracking-[0.4em] uppercase text-xs font-bold whitespace-nowrap`}
                  >
                    {goodWon ? "Loyal Knights" : "The Traitors' Circle"}
                  </span>
                  <span
                    className={`h-px grow bg-linear-to-r ${t.winAccent === "text-primary" ? "from-primary/60" : "from-tertiary/60"} to-transparent`}
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
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              DEFEAT / ABANDONED LAYOUT
              Inspired by ScreenDefeat (centered)
             ═══════════════════════════════════════════════════════════════════ */}
          {(isDefeat || isAbandoned) && "centerIcon" in t && (
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
                  <h3
                    className={`font-headline text-2xl mb-3 ${t.dominantAccent}`}
                  >
                    {t.dominantLabel}
                  </h3>
                  <p className="font-body text-on-surface-variant text-xs max-w-xs leading-relaxed">
                    {t.dominantDesc}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div
                      className={`h-1 w-12 ${t.dominantAccent === "text-tertiary" ? "bg-tertiary" : t.dominantAccent === "text-primary" ? "bg-primary" : "bg-on-surface-variant/30"}`}
                    ></div>
                    <div
                      className={`h-1 w-2 ${t.dominantAccent === "text-tertiary" ? "bg-tertiary/30" : t.dominantAccent === "text-primary" ? "bg-primary/30" : "bg-on-surface-variant/15"}`}
                    ></div>
                    <div
                      className={`h-1 w-2 ${t.dominantAccent === "text-tertiary" ? "bg-tertiary/30" : t.dominantAccent === "text-primary" ? "bg-primary/30" : "bg-on-surface-variant/15"}`}
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
          )}
        </div>
      </div>
    </div>
  );
}

// === Compact Faction Panel ===
function FactionPanel({
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
