"use client";

import { useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import RoleAccessory from "./RoleAccessory";
import { ROLE_DISPLAY, type WeredogRoleName } from "./nightConstants";

interface Player {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
  isModerator: boolean;
  role?: string;
  avatarUrl?: string | null;
  isLover?: boolean;
  loverUserId?: string;
}

interface WeredogGameOverProps {
  roomId?: string;
  winner: "Villager" | "Wolf" | "Cupid" | string;
  players: Player[];
  onRestart?: () => void;
  onBack?: () => void;
}

export default function WeredogGameOver({
  roomId,
  winner,
  players,
  onRestart,
  onBack,
}: WeredogGameOverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 440,
    padding: 4,
    minScale: 0.4,
    maxScale: 2.2,
  });

  // Filter out host from list
  const gamePlayers = players.filter((p) => !p.isModerator);

  // Divide into Humans vs Wolves
  const humans = gamePlayers.filter((p) => p.role !== "Wolf");
  const wolves = gamePlayers.filter((p) => p.role === "Wolf");

  // Style configurations based on the winner faction
  const factionConfig: Record<
    string,
    {
      title: string;
      bgImage: string;
      colorClass: string;
      glowColor: string;
    }
  > = {
    Villager: {
      title: "THE VILLAGE SURVIVED",
      bgImage: "/werewolf/gameover_villager.jpeg",
      colorClass: "text-emerald-400",
      glowColor: "rgba(16,185,129,0.3)",
    },
    Wolf: {
      title: "THE WOLVES HUNTED",
      bgImage: "/werewolf/gameover_wolf.jpeg",
      colorClass: "text-red-500",
      glowColor: "rgba(239,68,68,0.3)",
    },
    Cupid: {
      title: "LOVE CONQUERS ALL",
      bgImage: "/werewolf/gameover_villager.jpeg",
      colorClass: "text-rose-400",
      glowColor: "rgba(244,63,94,0.3)",
    },
  };

  const currentConfig = factionConfig[winner] || {
    title: "GAME OVER",
    bgImage: "/werewolf/weredog-lobby-bg.jpeg",
    colorClass: "text-amber-400",
    glowColor: "rgba(245,158,11,0.3)",
  };

  // Role Metadata for Vietnamese translation, border colors
  const getRoleMeta = (role?: string) => {
    switch (role) {
      case "Wolf":
        return { name: "Ma Sói", border: "border-red-650", text: "text-red-400" };
      case "Seer":
        return { name: "Tiên Tri", border: "border-purple-500/50", text: "text-purple-400" };
      case "Bodyguard":
        return { name: "Bảo Vệ", border: "border-amber-500/50", text: "text-amber-400" };
      case "Hunter":
        return { name: "Thợ Săn", border: "border-teal-500/50", text: "text-teal-400" };
      case "Witch":
        return { name: "Phù Thủy", border: "border-emerald-500/50", text: "text-emerald-400" };
      case "Cupid":
        return { name: "Cupid", border: "border-rose-500/50", text: "text-rose-400" };
      case "Elder":
        return { name: "Già Làng", border: "border-gray-400/50", text: "text-gray-300" };
      case "Villager":
      default:
        return { name: "Dân Làng", border: "border-slate-500/40", text: "text-slate-300" };
    }
  };

  // Helper to render horizontal player card
  const renderPlayerCard = (player: Player) => {
    const isDead = !player.isAlive;
    const meta = getRoleMeta(player.role);
    
    return (
      <div 
        key={player.userId}
        className="flex flex-col items-center select-none w-[72px] sm:w-[80px] shrink-0 transition-transform duration-200 hover:scale-[1.05]"
      >
        {/* Circular Avatar Wrapper */}
        <div className="relative">
          <div 
            className={`rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md relative overflow-visible ${
              isDead 
                ? "border-red-950/35 bg-black/60 grayscale opacity-45" 
                : `${meta.border} bg-[#222a2f]/80`
            }`}
            style={{
              width: "48px",
              height: "48px",
              boxShadow: isDead ? "none" : "0 4px 8px rgba(0,0,0,0.6)",
              backgroundColor: isDead ? "rgba(11, 13, 17, 0.8)" : "rgba(34, 42, 47, 0.7)",
              opacity: isDead ? 0.45 : 1,
              filter: isDead ? "grayscale(1)" : "none",
            }}
          >
            {/* Role frame decorator (Accessory) */}
            {player.role && ROLE_DISPLAY[player.role as WeredogRoleName]?.frameType && (
              <RoleAccessory 
                frameType={ROLE_DISPLAY[player.role as WeredogRoleName].frameType} 
                role={player.role as WeredogRoleName} 
              />
            )}

            {/* Avatar image or fallback emoji */}
            {player.avatarUrl || (player.avatar && (player.avatar.startsWith("/") || player.avatar.startsWith("http"))) ? (
              <AvatarDisplay
                avatarUrl={player.avatarUrl || player.avatar}
                name={player.name}
                size={48}
                className={`w-full h-full rounded-full ${isDead ? "grayscale opacity-40" : ""}`}
              />
            ) : (
              <span className="text-xl sm:text-2xl select-none">{player.avatar}</span>
            )}
          </div>

          {/* Lover Overlay (Cupid) */}
          {player.isLover && (
            <div 
              className="absolute -bottom-1 -left-1 w-[18px] h-[18px] bg-slate-900 border border-pink-500 text-pink-400 rounded-full flex items-center justify-center text-[9px] shadow-[0_0_8px_rgba(236,72,153,0.5)] z-20 font-bold select-none" 
              title="Cặp Đôi Tơ Hồng"
            >
              ❤️
            </div>
          )}
        </div>

        {/* Info Label underneath */}
        <div className="w-full mt-2 bg-black/55 border border-[#445257]/20 rounded px-1.5 py-0.5 text-center flex flex-col items-center">
          <span 
            className={`text-[9px] sm:text-[10px] font-bold truncate max-w-full block leading-none font-gothic-body ${
              isDead ? "text-[#445257] line-through" : "text-white"
            }`}
          >
            {player.name}
          </span>
          <span 
            className={`text-[7px] font-black uppercase tracking-widest leading-none mt-0.5 font-gothic-label ${
              isDead ? "text-red-500/50" : meta.text
            }`}
          >
            {meta.name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden select-none"
      style={{
        backgroundImage: `url('${currentConfig.bgImage}'), url('/werewolf/weredog-lobby-bg.jpeg')`,
      }}
    >
      {/* Dark Vignette Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/55 to-black/85 pointer-events-none z-10" />

      {/* Main Container */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between flex-1">
        {/* Header bar */}
        <WeredogHeader roomId={roomId} title="Kết Thúc Trò Chơi" onBack={onBack} />

        {/* Main content scaled stage */}
        <div
          ref={containerRef}
          className="flex-1 w-full relative overflow-hidden flex items-center justify-center pointer-events-none"
        >
          <div
            className="flex flex-col items-center justify-between py-2 pointer-events-none"
            style={{
              width: "800px",
              height: "440px",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Victory Announcement Header */}
            <div className="text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] mb-1 flex flex-col items-center gap-1">
              <h1
                className={`font-gothic-heading text-lg sm:text-xl md:text-2xl tracking-[0.12em] uppercase font-black ${currentConfig.colorClass}`}
                style={{
                  textShadow: `0 0 10px ${currentConfig.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
                }}
              >
                {currentConfig.title}
              </h1>
            </div>

            {/* Faction Rows (Humans Row on Top, Wolves Row on Bottom) */}
            <div className="w-full max-w-[760px] flex flex-col gap-2 mb-1.5 justify-center">
              
              {/* Row 1: Phe Con Người / Dân Làng */}
              <div className="flex flex-col bg-[#151a1d]/40 border border-[#445257]/15 rounded-lg p-2 shadow-md">
                <div className="flex items-center justify-between border-b border-[#445257]/15 pb-1 mb-2 px-1">
                  <span className="font-gothic-label text-[9px] uppercase tracking-widest font-black text-emerald-400">
                    Phe Con Người ({humans.length})
                  </span>
                </div>
                {/* Wrapped list of players with vertical padding to prevent accessory clipping */}
                <div className="flex flex-row flex-wrap gap-x-3.5 gap-y-6 justify-center pointer-events-auto pt-5 pb-2.5 px-2">
                  {humans.map(renderPlayerCard)}
                </div>
              </div>

              {/* Row 2: Phe Ma Sói */}
              <div className="flex flex-col bg-[#1c1214]/40 border border-red-950/20 rounded-lg p-2 shadow-md">
                <div className="flex items-center justify-between border-b border-red-950/20 pb-1 mb-2 px-1">
                  <span className="font-gothic-label text-[9px] uppercase tracking-widest font-black text-red-500">
                    Phe Ma Sói ({wolves.length})
                  </span>
                </div>
                {/* Wrapped list of players with vertical padding to prevent accessory clipping */}
                <div className="flex flex-row flex-wrap gap-x-3.5 gap-y-6 justify-center pointer-events-auto pt-5 pb-2.5 px-2">
                  {wolves.map(renderPlayerCard)}
                </div>
              </div>

            </div>

            {/* Play Again wax-seal button */}
            {onRestart && (
              <div className="flex justify-center pointer-events-auto w-full">
                <button
                  onClick={onRestart}
                  className="relative w-[180px] h-[48px] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer group"
                >
                  {/* Gothic Banner */}
                  <svg
                    width="180"
                    height="30"
                    viewBox="0 0 180 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-[9px] left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
                  >
                    <defs>
                      <linearGradient id="plaqueGradGameOver" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4d1b28" />
                        <stop offset="100%" stopColor="#250d14" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 2 L 170 2 L 175 7 L 175 9 L 180 15 L 175 21 L 175 23 L 170 28 L 10 28 L 5 23 L 5 21 L 0 15 L 5 9 L 5 7 Z"
                      fill="url(#plaqueGradGameOver)"
                      stroke="#cda372"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* "Chơi" Text Left */}
                  <span
                    className="absolute left-[20px] w-[45px] text-center top-[24px] -translate-y-1/2 font-gothic-body text-[#e1c7a5] text-[10px] sm:text-xs font-semibold italic tracking-wider select-none uppercase"
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    Chơi
                  </span>

                  {/* Center Wax Seal Image */}
                  <div className="absolute z-10 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)] transition-all">
                    <Image
                      src="/werewolf/logo.png"
                      alt="Wax Seal"
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>

                  {/* "Lại" Text Right */}
                  <span
                    className="absolute right-[20px] w-[45px] text-center top-[24px] -translate-y-1/2 font-gothic-body text-[#e1c7a5] text-[10px] sm:text-xs font-semibold italic tracking-wider select-none uppercase"
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    Lại
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
