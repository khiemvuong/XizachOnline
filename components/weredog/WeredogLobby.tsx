"use client";

import { useState, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

interface WeredogLobbyProps {
  roomId: string;
  players: Player[];
  onStartGame?: () => void;
}

// Spaced out position coordinates to prevent overlaps
const SLOT_POSITIONS = [
  { left: "50%", top: "20%" },   // 1. Luna (Top Center)
  { left: "31%", top: "21%" },   // 2. Buster (Top Left)
  { left: "69%", top: "21%" },   // 3. Rocky (Top Right)
  { left: "18%", top: "34%" },   // 4. Zoe (Upper Left)
  { left: "82%", top: "34%" },   // 5. Chloe (Upper Right)
  { left: "8%", top: "54%" },   // 6. Winston (Middle Left)
  { left: "92%", top: "54%" },   // 7. Duke (Middle Right)
  { left: "19%", top: "76%" },   // 8. Zoe 2 (Lower Left)
  { left: "81%", top: "76%" },   // 9. Daisy (Lower Right)
];

const AVAILABLE_ROLES = {
  Wolf: { name: "Chó Sói", desc: "Thức giấc mỗi đêm để đi săn dân làng." },
  Bodyguard: { name: "Bảo Vệ", desc: "Canh gác bảo vệ một người chơi đêm nay." },
  Seer: { name: "Tiên Tri", desc: "Soi căn cước thật của một người chơi." },
  Witch: { name: "Phù Thủy", desc: "Sử dụng bình sinh tử (cứu hoặc giết)." },
  Hunter: { name: "Thợ Săn", desc: "Kéo kẻ thù cùng xuống mồ khi ngã xuống." },
  Cupid: { name: "Cupid", desc: "Xe duyên kết tơ lòng cho hai người chơi." },
  Elder: { name: "Già Làng", desc: "Gánh chịu 2 lần cắn từ bầy sói đói." },
};

export default function WeredogLobby({ roomId, players, onStartGame }: WeredogLobbyProps) {
  const [wolfCount, setWolfCount] = useState<number>(2);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Wolf", "Bodyguard", "Seer", "Witch", "Hunter", "Cupid"
  ]);

  const toggleRole = (roleKey: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) 
        ? prev.filter(r => r !== roleKey) 
        : [...prev, roleKey]
    );
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 380,
    padding: 4,
    minScale: 0.4,
    maxScale: 2.2, // Allow zoom up to 2.2x on desktop screens
  });

  return (
    <div 
      className="relative w-full min-h-screen bg-cover bg-center flex flex-col justify-between"
      style={{ backgroundImage: "url('/werewolf/weredog-lobby-bg.jpeg')", backgroundAttachment: "fixed" }}
    >
      {/* Dark Vignette Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Top UI Bar (Replaces Bottom UI Bar) */}
      <WeredogHeader roomId={roomId} playerCount={players.length} />

      {/* Main Interactive Stage */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none">
        <div
          className="relative transition-transform duration-200 pointer-events-none"
          style={{
            width: "800px",
            height: "380px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Central Control Panel (Logo + Settings + Start Button) */}
          <div className="absolute left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full max-w-[500px] z-30 select-none">
            {/* 1. Game Title Logo */}
            <div className="text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] mb-2">
              <h1 className="font-gothic-heading text-[#cdd6d8] text-xl sm:text-2xl md:text-3xl tracking-[0.12em] uppercase font-bold text-shadow-maroon">
                Werewolf
              </h1>
              <p className="font-gothic-heading text-[#829ea2]/90 text-[10px] sm:text-xs tracking-[0.2em] uppercase mt-0.5 font-medium">
                Dog Village
              </p>
            </div>

            {/* 2. Wolf Count Controller */}
            <div className="flex items-center gap-3 mb-2 select-none pointer-events-auto">
              <span className="text-white text-[10px] uppercase tracking-widest font-black font-gothic-ui">Bầy Sói:</span>
              <div className="flex items-center bg-[#151a1d]/95 border border-red-950/80 rounded-full p-0.5 shadow-lg">
                <button
                  onClick={(e) => { e.stopPropagation(); wolfCount > 1 && setWolfCount(wolfCount - 1); }}
                  className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-white rounded-full hover:bg-red-950/40 transition-colors cursor-pointer text-xs font-black active:scale-90"
                >
                  -
                </button>
                <span className="text-red-500 font-gothic-label font-black text-[11px] px-2 uppercase tracking-widest min-w-[56px] text-center">
                  {wolfCount} Sói
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); wolfCount < 5 && setWolfCount(wolfCount + 1); }}
                  className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-white rounded-full hover:bg-red-950/40 transition-colors cursor-pointer text-xs font-black active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. Active Roles Row */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-[420px] pointer-events-auto mb-3.5">
              {Object.entries(AVAILABLE_ROLES)
                .filter(([key]) => key !== "Wolf")
                .map(([key, role]) => {
                  const isActive = selectedRoles.includes(key);
                  const roleColors: Record<string, { activeBg: string; activeBorder: string; activeText: string; shadow: string }> = {
                    Bodyguard: { activeBg: "bg-amber-950/40", activeBorder: "border-amber-500/60", activeText: "text-amber-400", shadow: "shadow-[0_0_10px_rgba(245,158,11,0.25)]" },
                    Seer: { activeBg: "bg-purple-950/40", activeBorder: "border-purple-500/60", activeText: "text-purple-400", shadow: "shadow-[0_0_10px_rgba(168,85,247,0.25)]" },
                    Witch: { activeBg: "bg-emerald-950/40", activeBorder: "border-emerald-500/60", activeText: "text-emerald-400", shadow: "shadow-[0_0_10px_rgba(16,185,129,0.25)]" },
                    Hunter: { activeBg: "bg-teal-950/40", activeBorder: "border-teal-500/60", activeText: "text-teal-400", shadow: "shadow-[0_0_10px_rgba(20,184,166,0.25)]" },
                    Cupid: { activeBg: "bg-rose-950/40", activeBorder: "border-rose-500/60", activeText: "text-rose-400", shadow: "shadow-[0_0_10px_rgba(244,63,94,0.25)]" },
                    Elder: { activeBg: "bg-gray-950/40", activeBorder: "border-gray-400/60", activeText: "text-gray-300", shadow: "shadow-[0_0_10px_rgba(156,163,175,0.25)]" },
                  };

                  const colors = roleColors[key] || { activeBg: "bg-[#3b1c26]", activeBorder: "border-red-500/50", activeText: "text-red-400", shadow: "" };

                  return (
                    <button
                      key={key}
                      onClick={(e) => { e.stopPropagation(); toggleRole(key); }}
                      className={`px-2.5 py-1 rounded border text-[9px] sm:text-[10px] font-gothic-label uppercase tracking-widest font-black transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ${
                        isActive
                          ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder} ${colors.shadow}`
                          : "bg-black/45 text-[#829ea2]/35 border-[#445257]/35 opacity-55 hover:opacity-85 hover:border-[#829ea2]/30"
                      }`}
                    >
                      {role.name}
                    </button>
                  );
                })}
            </div>

            {/* 4. Start Game wax-seal button */}
            {onStartGame && (
              <div className="flex justify-center pointer-events-auto w-full">
                <button 
                  onClick={onStartGame}
                  className="relative w-[200px] h-[52px] hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer group"
                >
                  {/* Double-bordered Gothic Plaque Banner */}
                  <svg 
                    width="200" 
                    height="32" 
                    viewBox="0 0 200 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-[10px] left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  >
                    <defs>
                      <linearGradient id="plaqueGradCenter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4d1b28" />
                        <stop offset="100%" stopColor="#250d14" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 12 2 L 188 2 L 194 8 L 194 10 L 200 16 L 194 22 L 194 24 L 188 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z" 
                      fill="url(#plaqueGradCenter)" 
                      stroke="#cda372" 
                      strokeWidth="1.5" 
                    />
                    <path 
                      d="M 13 4 L 187 4 L 192 9 L 192 11 L 197 16 L 192 21 L 192 23 L 187 28 L 13 28 L 8 23 L 8 21 L 3 16 L 8 11 L 8 9 Z" 
                      stroke="#cda372" 
                      strokeWidth="0.5" 
                      strokeOpacity="0.8" 
                      fill="none"
                    />
                  </svg>

                  {/* "Start" Text Left */}
                  <span 
                    className="absolute left-[24px] w-[50px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-[#e1c7a5] text-[10px] sm:text-xs font-semibold italic tracking-wider select-none"
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    Start
                  </span>

                  {/* Center Wax Seal Image */}
                  <div 
                    className="absolute z-10 w-12 h-12 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.8)] overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:shadow-[0_0_15px_rgba(205,163,114,0.4)] transition-all"
                  >
                    <Image 
                      src="/werewolf/logo.png" 
                      alt="Wax Seal" 
                      width={48} 
                      height={48} 
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>

                  {/* "Game" Text Right */}
                  <span 
                    className="absolute right-[24px] w-[50px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-[#e1c7a5] text-[10px] sm:text-xs font-semibold italic tracking-wider select-none"
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    Game
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Player Slots Circular Layout */}
          {SLOT_POSITIONS.map((pos, index) => {
            const player = players[index];
            const hasPlayer = !!player;
            const isHost = player?.isHost;

            return (
              <div
                key={index}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 pointer-events-auto"
                style={{ left: pos.left, top: pos.top }}
              >
                {/* Host Badge crown on top of frame */}
                {hasPlayer && isHost && (
                  <div className="absolute -top-2.5 z-20 bg-amber-600 border border-amber-400 text-amber-100 text-[7px] font-bold px-1 py-0.5 rounded-full font-gothic-ui shadow-[0_2px_8px_rgba(217,119,6,0.6)] flex items-center gap-0.5">
                    👑 HOST
                  </div>
                )}

                {/* Avatar circular frame (3D Bezel Look, responsive sizing) */}
                <div 
                  className={`w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full border-[3px] md:border-4 bg-[#222a2f]/20 backdrop-blur-[2px] flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all relative ${
                    hasPlayer 
                      ? isHost 
                        ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.6)] bg-linear-to-b from-[#222a2f]/90 to-[#3b1c26]/40"
                        : "border-[#829ea2] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.6)] bg-[#222a2f]/70"
                      : "border-[#445257] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] hover:border-[#445257]/80"
                  }`}
                >
                  {hasPlayer ? (
                    <span className="animate-fade-in">{player.avatar}</span>
                  ) : (
                    <span className="text-transparent">?</span>
                  )}
                </div>

                {/* Player Name below slot (responsive text size) */}
                <div 
                  className={`mt-1.5 font-gothic-body text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold tracking-wide transition-all ${
                    hasPlayer 
                      ? isHost 
                        ? "text-amber-300 font-bold" 
                        : "text-[#cdd6d8]" 
                      : "text-[#445257]/60"
                  }`}
                  style={{ textShadow: hasPlayer ? "0 2px 4px rgba(0,0,0,0.9)" : "none" }}
                >
                  {hasPlayer ? player.name : "Waiting..."}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Horizontal Row for Extra Players (10th onwards) */}
      {players.length > 9 && (
        <div className="relative z-20 mx-auto mb-4 flex items-center gap-2 md:gap-3 bg-[#0b0d11]/85 backdrop-blur-md px-3 py-1.5 md:px-5 md:py-2 border border-[#445257]/20 rounded-full max-w-[90%] overflow-x-auto shadow-lg font-gothic-ui">
          <span className="text-[9px] sm:text-xs md:text-sm uppercase font-bold text-[#829ea2]/60 self-center tracking-widest mr-1">Extra:</span>
          {players.slice(9).map((player, idx) => (
            <div key={`${player.id}-${idx}`} className="flex items-center gap-1.5 md:gap-2 bg-[#222a2f]/70 border border-[#445257]/45 rounded-full px-2 py-0.5 md:px-3 md:py-1 pr-2.5 md:pr-3.5 shadow-inner">
              <div className={`w-6.5 h-6.5 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center text-sm sm:text-base md:text-xl relative ${
                player.isHost 
                  ? "border-amber-500 bg-amber-950/20" 
                  : "border-[#829ea2] bg-[#222a2f]/90 shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
              }`}>
                {player.avatar}
                {player.isHost && <span className="absolute -top-1 -right-1 text-[7px] sm:text-[8px]">👑</span>}
              </div>
              <span className="font-gothic-body text-[10px] sm:text-xs md:text-sm font-semibold text-[#cdd6d8] whitespace-nowrap">{player.name}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
