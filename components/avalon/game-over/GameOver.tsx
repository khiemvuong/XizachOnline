"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
import Image from "next/image";
import { type RefObject, useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Skull,
  HeartCrack,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSceneScale } from "@/hooks/useSceneScale";
import VictoryScene from "./VictoryScene";
import DefeatScene from "./DefeatScene";
import SkillUsageHistoryPanel from "./SkillUsageHistoryPanel";
import { type GameOverTheme } from "./gameoverTypes";

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
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SCENE_W,
    sceneHeight: SCENE_H,
    padding: 16,
    minScale: 0.28,
    minViewportWidth: 280,
    minViewportHeight: 200,
  });

  // Split players by team
  const goodPlayers = gameState.players.filter((p) => p.team === "Good");
  const evilPlayers = gameState.players.filter((p) => p.team === "Evil");
  const winnerLabel = isAbandoned
    ? "Loyal Servants of Arthur"
    : goodWon
      ? "Loyal Servants of Arthur"
      : "Minions of Mordred";
  const loserLabel = isAbandoned
    ? "Minions of Mordred"
    : goodWon
      ? "Minions of Mordred"
      : "Loyal Servants of Arthur";
  const winnerPlayers = isAbandoned ? goodPlayers : goodWon ? goodPlayers : evilPlayers;
  const loserPlayers = isAbandoned ? evilPlayers : goodWon ? evilPlayers : goodPlayers;

  // Theme config per case
  const themes: Record<string, GameOverTheme> = {
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
      centerIcon: <HeartCrack className="text-cyan-200 w-12 h-12" />,
      iconBg: "bg-cyan-500/10 border-cyan-300/25 shadow-[0_0_24px_rgba(56,189,248,0.22)]",
      title: "ETERNAL BOND FULFILLED",
      sub: "Merlin đã đồng quy vô tận thành công. Trận đấu khép lại trong thế hòa.",
      accentColor: "text-cyan-200",
      subColor: "text-cyan-100/80",
      dominantLabel: "BOTH FACTIONS BOUND",
      dominantDesc:
        "Thanh gươm sát thủ chạm tới Merlin, nhưng lời nguyền kéo Mordred cùng chìm vào hư vô. Không phe nào giành được vinh quang cuối cùng.",
      dominantAccent: "text-cyan-200",
      dominantBorder: "bg-cyan-500/10 border-cyan-300/25",
      winAccent: "text-primary",
      loseAccent: "text-tertiary",
      winPanelBorder: "border-outline-variant/30",
      losePanelBorder: "border-outline-variant/30 opacity-70",
      winIcon: <ShieldCheck className="h-4 w-4" />,
      loseIcon: <Skull className="h-4 w-4" />,
    },
  };

  const t = themes[personalCase];

  // Action button
  const actionButton = isHost ? (
    <button
      className={`inline-flex items-center gap-3 rounded-xl px-8 py-3.5 text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
        personalCase === "evil-win" || personalCase === "good-lose"
          ? "bg-[#ff3131] text-white shadow-[0_0_20px_rgba(255,49,49,0.4)]"
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

      <SkillUsageHistoryPanel gameState={gameState} />

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
          {isVictory && (
            <VictoryScene
              t={t}
              goodWon={goodWon}
              winnerLabel={winnerLabel}
              loserLabel={loserLabel}
              winnerPlayers={winnerPlayers}
              loserPlayers={loserPlayers}
              me={me}
              gameState={gameState}
              actionButton={actionButton}
            />
          )}

          {(isDefeat || isAbandoned) && (
            <DefeatScene
              t={t}
              winnerLabel={winnerLabel}
              loserLabel={loserLabel}
              winnerPlayers={winnerPlayers}
              loserPlayers={loserPlayers}
              me={me}
              gameState={gameState}
              actionButton={actionButton}
              isDraw={isAbandoned}
            />
          )}
        </div>
      </div>
    </div>
  );
}
