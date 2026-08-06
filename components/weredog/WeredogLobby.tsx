"use client";

import { useRef, useMemo, useCallback } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import RoleAccessory, { LOBBY_ACCESSORIES_LIST } from "./RoleAccessory";

interface Player {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isModerator: boolean;
  avatarUrl?: string | null;
}

interface WeredogLobbyProps {
  roomId: string;
  players: Player[];
  onStartGame?: () => void;
  profileAvatarUrl?: string | null;
  profileName?: string;
  onOpenProfile?: () => void;
  isHost?: boolean;
  wolfCount?: number;
  selectedRoles?: string[];
  onUpdateSettings?: (settings: { wolfCount: number; enabledRoles: string[] }) => void;
  myUserId?: string;
  onBack?: () => void;
  onTransferHost?: (targetUserId: string) => void;
}

// Non-overlapping staggered wing positions (6 left, 6 right) to keep center column completely free
const SLOT_POSITIONS = [
  { left: "8%",  top: "15%" },    // 1. Upper Left (Outer)
  { left: "22%", top: "20%" },   // 2. Upper Left (Inner)
  { left: "40%",  top: "15%" },   // 3. Middle Left (Outer)
  { left: "8%",  top: "40%" },   // 4. Lower Left (Outer)
  { left: "22%", top: "60%" },   // 5. Lower Left (Inner)
  { left: "8%",  top: "70%" },   // 6. Bottom Left (Outer)
  { left: "92%", top: "15%" },    // 7. Upper Right (Outer)
  { left: "78%", top: "20%" },   // 8. Upper Right (Inner)
  { left: "65%", top: "15%" },   // 9. Middle Right (Outer)
  { left: "92%", top: "40%" },   // 10. Lower Right (Outer)
  { left: "78%", top: "60%" },   // 11. Lower Right (Inner)
  { left: "92%", top: "70%" },   // 12. Bottom Right (Outer)
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

export default function WeredogLobby({
  roomId,
  players,
  onStartGame,
  profileAvatarUrl,
  profileName,
  onOpenProfile,
  isHost = false,
  wolfCount,
  selectedRoles,
  onUpdateSettings,
  myUserId,
  onBack,
  onTransferHost,
}: WeredogLobbyProps) {
  const activeWolfCount = wolfCount ?? 2;
  const activeSelectedRoles = useMemo(() => {
    return selectedRoles ?? ["Wolf", "Bodyguard", "Seer", "Witch", "Hunter", "Cupid"];
  }, [selectedRoles]);

  const activePlayersCount = players.filter(p => !p.isModerator).length;

  const playerAccessoryMap = useMemo(() => {
    const sorted = [...players].sort((a, b) => (a.userId || "").localeCompare(b.userId || ""));
    const m = new Map<string, typeof LOBBY_ACCESSORIES_LIST[0]>();
    sorted.forEach((p, idx) => {
      if (p.userId) {
        m.set(p.userId, LOBBY_ACCESSORIES_LIST[idx % LOBBY_ACCESSORIES_LIST.length]);
      }
    });
    return m;
  }, [players]);

  const toggleRole = (roleKey: string) => {
    const isAdding = !activeSelectedRoles.includes(roleKey);
    if (isAdding && activeSelectedRoles.length + activeWolfCount >= activePlayersCount) {
      return; // Prevent exceeding player count
    }

    const updated = activeSelectedRoles.includes(roleKey)
      ? activeSelectedRoles.filter(r => r !== roleKey)
      : [...activeSelectedRoles, roleKey];

    onUpdateSettings?.({ wolfCount: activeWolfCount, enabledRoles: updated });
  };

  const maxWolves = useMemo(() => Math.max(1, Math.floor((activePlayersCount - 1) / 2)), [activePlayersCount]);

  const changeWolfCount = useCallback((val: number) => {
    if (val > maxWolves) return;
    if (val > activeWolfCount && activeSelectedRoles.length + val > activePlayersCount) {
      return; // Prevent exceeding player count
    }

    onUpdateSettings?.({ wolfCount: val, enabledRoles: activeSelectedRoles });
  }, [maxWolves, activeWolfCount, activeSelectedRoles, activePlayersCount, onUpdateSettings]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 420,
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

      {/* Top UI Bar */}
      <WeredogHeader 
        roomId={roomId} 
        playerCount={players.length} 
        profileAvatarUrl={profileAvatarUrl}
        profileName={profileName}
        onOpenProfile={onOpenProfile}
        onBack={onBack}
        centerContent={
          <div className="text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center gap-1.5 sm:gap-2.5 pointer-events-none whitespace-nowrap">
            <h1 className="font-gothic-heading text-[#cdd6d8] text-sm sm:text-base md:text-lg tracking-widest uppercase font-bold text-shadow-maroon leading-none">
              Werewolf
            </h1>
            <span className="text-[#829ea2]/40 text-xs md:text-sm font-semibold select-none">•</span>
            <p className="font-gothic-heading text-[#829ea2]/80 text-[10px] sm:text-xs md:text-sm tracking-[0.18em] uppercase font-medium leading-none">
              Dog Village
            </p>
          </div>
        }
      />

      {/* Main Interactive Stage */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none">
        <div
          className="relative transition-transform duration-200 pointer-events-none"
          style={{
            width: "800px",
            height: "420px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Central Control Panel (Logo + Settings + Start Button) */}
          <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full max-w-[500px] z-30 select-none">
            {/* 2. Wolf Count Configuration */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#0b0d11]/85 border border-[#445257]/20 rounded-full px-3 py-1.5 shadow-lg pointer-events-auto font-gothic-ui mb-3">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-[#829ea2]/60 tracking-wider">Số lượng sói:</span>
              <button 
                onClick={() => changeWolfCount(Math.max(1, activeWolfCount - 1))}
                disabled={!isHost}
                className={`w-6 h-6 rounded-full border border-[#445257]/45 text-[#829ea2] hover:text-white flex items-center justify-center text-xs transition-colors shadow-inner ${isHost ? "cursor-pointer hover:bg-[#3b1c26]/60" : "opacity-40 cursor-not-allowed"}`}
              >
                -
              </button>
              <span className="font-mono text-xs sm:text-sm font-black text-rose-500 w-4 text-center">{activeWolfCount}</span>
              <button 
                onClick={() => changeWolfCount(Math.min(maxWolves, activeWolfCount + 1))}
                disabled={!isHost || activeWolfCount >= maxWolves || (activeSelectedRoles.length + activeWolfCount >= activePlayersCount)}
                className={`w-6 h-6 rounded-full border border-[#445257]/45 text-[#829ea2] hover:text-white flex items-center justify-center text-xs transition-colors shadow-inner ${isHost && activeWolfCount < maxWolves && (activeSelectedRoles.length + activeWolfCount < activePlayersCount) ? "cursor-pointer hover:bg-[#3b1c26]/60" : "opacity-40 cursor-not-allowed"}`}
              >
                +
              </button>
            </div>

            {/* 3. Special Roles Selection (Host Only) */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-[420px] pointer-events-auto px-4 mb-3">
              {Object.entries(AVAILABLE_ROLES)
                .filter(([key]) => key !== "Wolf")
                .map(([key, role]) => {
                  const isActive = activeSelectedRoles.includes(key);
                  const isLimitReached = !isActive && (activeSelectedRoles.length + activeWolfCount >= activePlayersCount);

                  return (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isHost) toggleRole(key);
                      }}
                      disabled={!isHost || isLimitReached}
                      className={`px-2.5 py-1 rounded border text-[9px] sm:text-[10px] font-gothic-label uppercase tracking-widest font-black transition-all duration-200 ${
                        isHost && !isLimitReached ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "opacity-60 cursor-not-allowed"
                      } ${
                        isActive
                          ? "bg-[#3b1c26]/85 text-[#e1c7a5] border-[#cda372] shadow-[0_0_12px_rgba(205,163,114,0.25)]"
                          : "bg-black/60 text-[#829ea2]/65 border-[#829ea2]/25 hover:border-[#829ea2]/50 hover:text-white hover:bg-black/85"
                      }`}
                      title={role.desc}
                    >
                      {role.name}
                    </button>
                  );
                })}
            </div>

            {/* 4. Start Game wax-seal button / Waiting text */}
            {onStartGame && (
              <div className="flex flex-col items-center justify-center pointer-events-auto w-full mt-2">
                {!isHost ? (
                  <span className="font-gothic-label text-[#e1c7a5] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-[10px] sm:text-[11px] uppercase tracking-widest font-bold animate-pulse">
                    Đang chờ Quản trò khởi động trò chơi...
                  </span>
                ) : (
                  <>
                    {activePlayersCount < 2 && (
                      <span className="font-gothic-body text-rose-400 text-[10px] sm:text-xs font-semibold mb-2 animate-pulse">
                        ⚠️ Cần tối thiểu 2 người chơi để bắt đầu (Hiện tại: {activePlayersCount}/12)
                      </span>
                    )}
                    {activeWolfCount >= activePlayersCount && (
                      <span className="font-gothic-body text-rose-400 text-[10px] sm:text-xs font-semibold mb-2 animate-pulse">
                        ⚠️ Số sói ({activeWolfCount}) không được lớn hơn hoặc bằng số người chơi ({activePlayersCount})
                      </span>
                    )}
                    <button 
                      onClick={onStartGame}
                      disabled={activePlayersCount < 2 || activeWolfCount >= activePlayersCount}
                      className={`relative w-[200px] h-[52px] transition-all duration-200 group ${
                        activePlayersCount < 2 || activeWolfCount >= activePlayersCount
                          ? "opacity-40 cursor-not-allowed filter grayscale"
                          : "hover:scale-[1.04] active:scale-95 cursor-pointer"
                      }`}
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Player Slots Circular Layout */}
          {SLOT_POSITIONS.map((pos, index) => {
            const player = players[index];
            const hasPlayer = !!player;
            const isPlayerHost = player?.isHost;

            return (
              <div
                key={index}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 pointer-events-auto"
                style={{ left: pos.left, top: pos.top }}
              >
                {/* Host Badge crown on top of frame */}
                {hasPlayer && isPlayerHost && (
                  <div className="absolute -top-2.5 z-20 bg-amber-600 border border-amber-400 text-amber-100 text-[7px] font-bold px-1 py-0.5 rounded-full font-gothic-ui shadow-[0_2px_8px_rgba(217,119,6,0.6)] flex items-center gap-0.5">
                    👑 HOST
                  </div>
                )}

                <div 
                  className={`w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-15 lg:h-15 rounded-full border-[3px] md:border-4 bg-[#222a2f]/20 backdrop-blur-[2px] flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all relative ${
                    hasPlayer 
                      ? isPlayerHost 
                        ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.6)] bg-linear-to-b from-[#222a2f]/90 to-[#3b1c26]/40"
                        : player.userId === myUserId
                        ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] bg-[#222a2f]/70"
                        : "border-[#829ea2] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.6)] bg-[#222a2f]/70"
                      : "border-[#829ea2]/45 bg-[#222a2f]/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:border-[#829ea2]/70 transition-all"
                  }`}
                >
                  {/* Transfer Host Button for Host */}
                  {isHost && hasPlayer && !isPlayerHost && player.userId && (
                    <button
                      onClick={() => onTransferHost?.(player.userId!)}
                      className="absolute -top-2 -right-2 z-30 bg-[#3b1c26] border border-amber-500/80 text-amber-400 hover:text-white hover:bg-amber-600 hover:border-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-all cursor-pointer group"
                      title="Phong làm Quản Trò"
                    >
                      👑
                    </button>
                  )}
                  {/* Accessory Image Overlay */}
                  {hasPlayer && player.userId && playerAccessoryMap.get(player.userId) && (
                    <RoleAccessory customAccessory={playerAccessoryMap.get(player.userId)} />
                  )}

                  {hasPlayer ? (
                    player.avatarUrl || (player.avatar && (player.avatar.startsWith("/") || player.avatar.startsWith("http"))) ? (
                      <AvatarDisplay
                        avatarUrl={player.avatarUrl || player.avatar}
                        name={player.name}
                        size={56}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="animate-fade-in text-2xl sm:text-3xl md:text-4xl select-none">
                        {player.avatar || player.name.charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    <span className="text-transparent">?</span>
                  )}
                </div>

                {/* Player Name below slot */}
                <div 
                  className={`mt-1.5 font-gothic-body text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-semibold tracking-wide transition-all ${
                    hasPlayer 
                      ? isPlayerHost 
                        ? "text-amber-300 font-bold" 
                        : player.userId === myUserId
                        ? "text-emerald-400 font-bold"
                        : "text-[#cdd6d8]" 
                      : "text-[#829ea2]/65 font-medium italic"
                  }`}
                  style={{ textShadow: hasPlayer ? "0 2px 4px rgba(0,0,0,0.9)" : "none" }}
                >
                  {hasPlayer ? (
                    <>
                      {player.name}
                      {player.userId === myUserId && " (Bạn)"}
                    </>
                  ) : (
                    "Chờ..."
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Horizontal Row for Extra Players (13th onwards) */}
      {players.length > 12 && (
        <div className="relative z-20 mx-auto mb-4 flex items-center gap-2 md:gap-3 bg-[#0b0d11]/85 backdrop-blur-md px-3 py-1.5 md:px-5 md:py-2 border border-[#445257]/20 rounded-full max-w-[90%] overflow-x-auto shadow-lg font-gothic-ui">
          <span className="text-[9px] sm:text-xs md:text-sm uppercase font-bold text-[#829ea2]/60 self-center tracking-widest mr-1">Extra:</span>
          {players.slice(12).map((player, idx) => (
            <div key={`${player.id}-${idx}`} className="flex items-center gap-1.5 md:gap-2 bg-[#222a2f]/70 border border-[#445257]/45 rounded-full px-2 py-0.5 md:px-3 md:py-1 pr-2.5 md:pr-3.5 shadow-inner">
              <div className={`w-6.5 h-6.5 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center text-sm sm:text-base md:text-xl relative ${
                player.isHost 
                  ? "border-amber-500 bg-amber-950/20" 
                  : player.userId === myUserId
                  ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "border-[#829ea2] bg-[#222a2f]/90 shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
              }`}>
                {/* Transfer Host Button for Host in Extra List */}
                {isHost && !player.isHost && player.userId && (
                  <button
                    onClick={() => onTransferHost?.(player.userId!)}
                    className="absolute -top-1 -right-1 z-30 bg-[#3b1c26] border border-amber-500/80 text-amber-400 hover:text-white hover:bg-amber-600 hover:border-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-all cursor-pointer group animate-fade-in"
                    title="Phong làm Quản Trò"
                  >
                    👑
                  </button>
                )}
                {player.avatarUrl || (player.avatar && (player.avatar.startsWith("/") || player.avatar.startsWith("http"))) ? (
                  <AvatarDisplay
                    avatarUrl={player.avatarUrl || player.avatar}
                    name={player.name}
                    size={32}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-xs sm:text-sm select-none">{player.avatar || player.name.charAt(0).toUpperCase()}</span>
                )}
                {player.isHost && <span className="absolute -top-1 -right-1 text-[7px] sm:text-[8px] z-10">👑</span>}
              </div>
              <span className="font-gothic-body text-[10px] sm:text-xs md:text-sm font-semibold text-[#cdd6d8] whitespace-nowrap">
                {player.name}
                {player.userId === myUserId && " (Bạn)"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
