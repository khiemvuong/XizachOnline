"use client";

import { useRef, useState } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";
import NightPlayerCircle from "./NightPlayerCircle";
import { type NightPlayer } from "./nightConstants";

interface WeredogDayStartProps {
  roomId?: string;
  dayNumber?: number;
  isHost: boolean;
  players: NightPlayer[];
  myUserId: string;
  deathsThisNight: string[]; // userIds of players who died tonight
  pendingHunterShotUserId?: string | null;
  dayStartNextAction?: "vote" | "night";
  onHunterShoot?: (targetUserId: string) => void;
  onStartVoting?: () => void;
  onBack?: () => void;
}

export default function WeredogDayStart({
  roomId,
  dayNumber = 1,
  isHost,
  players,
  myUserId,
  deathsThisNight,
  pendingHunterShotUserId,
  dayStartNextAction = "vote",
  onHunterShoot,
  onStartVoting,
  onBack,
}: WeredogDayStartProps) {
  const [hunterSelectedId, setHunterSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 380,
    padding: 4,
    minScale: 0.4,
    maxScale: 2.2,
  });
  const pendingHunter = pendingHunterShotUserId
    ? players.find((p) => p.userId === pendingHunterShotUserId)
    : null;
  const isHunterShooter = !!pendingHunterShotUserId && myUserId === pendingHunterShotUserId;
  const hunterDisabledIds = players
    .filter((p) => !p.isAlive || p.isHost || p.userId === pendingHunterShotUserId)
    .map((p) => p.userId);
  const hunterSelectedPlayer = hunterSelectedId
    ? players.find((p) => p.userId === hunterSelectedId)
    : null;
  const continueLabel = dayStartNextAction === "night" ? "VÀO ĐÊM" : "BỎ PHIẾU TREO CỔ";

  if (pendingHunterShotUserId) {
    return (
      <div
        className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden select-none"
        style={{ backgroundImage: "url('/werewolf/weredog-lobby-bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-[#180b10]/55 to-[#2c2018]/70 pointer-events-none z-10" />

        <div className="relative z-20 w-full h-full flex flex-col justify-between flex-1">
          <WeredogHeader roomId={roomId} title={`Phát Súng Cuối - Ngày ${dayNumber}`} onBack={onBack} />

          <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
            <NightPlayerCircle
              players={players}
              selectedIds={hunterSelectedId ? [hunterSelectedId] : []}
              onSelectPlayer={isHunterShooter ? setHunterSelectedId : undefined}
              disabledIds={hunterDisabledIds}
              highlightColor="#f59e0b"
              glowColor="rgba(245,158,11,0.45)"
              myUserId={myUserId}
              aimedUserIds={hunterSelectedId ? [hunterSelectedId] : []}
              centerContent={
                <div className="w-full max-w-[300px] animate-fade-in text-center">
                  <span className="font-gothic-label text-[10px] uppercase tracking-[0.35em] text-amber-300/80">
                    Thợ săn ngã xuống
                  </span>
                  <h1
                    className="mt-2 font-gothic-heading text-2xl sm:text-3xl uppercase tracking-widest font-black text-amber-300"
                    style={{ textShadow: "0 0 14px rgba(245,158,11,0.35), 0 2px 4px rgba(0,0,0,0.9)" }}
                  >
                    Final shot
                  </h1>
                  <p className="mt-2 font-serif text-xs sm:text-sm italic leading-relaxed text-[#e1c7a5]/85">
                    {isHunterShooter
                      ? "Chọn một người còn sống để bắn trước khi ngày mới tiếp tục."
                      : `Đang chờ ${pendingHunter?.name ?? "Thợ săn"} chọn mục tiêu cuối cùng...`}
                  </p>

                  {isHunterShooter && (
                    <div className="mt-4 flex flex-col items-center gap-2 pointer-events-auto">
                      <p className="min-h-5 font-gothic-label text-[10px] uppercase tracking-widest text-amber-200">
                        {hunterSelectedPlayer ? `Đang ngắm: ${hunterSelectedPlayer.name}` : "Chưa chọn mục tiêu"}
                      </p>
                      <button
                        type="button"
                        onClick={() => hunterSelectedId && onHunterShoot?.(hunterSelectedId)}
                        disabled={!hunterSelectedId}
                        className="rounded-lg border border-amber-400/50 bg-[#3b1c26]/85 px-5 py-2.5 font-gothic-label text-xs font-black uppercase tracking-widest text-amber-100 shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-all hover:scale-[1.03] hover:bg-[#5a1d2e] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                      >
                        Bắn mục tiêu
                      </button>
                    </div>
                  )}
                </div>
              }
              minScale={0.9}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden select-none"
      style={{ backgroundImage: "url('/werewolf/weredog-lobby-bg.jpeg')" }}
    >
      {/* Warm Golden/Foggy Vignette Overlay to represent Sunrise */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-[#2c2018]/70 pointer-events-none z-10" />

      {/* Main flex container */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between flex-1">
        
        {/* Day header bar */}
        <WeredogHeader
          roomId={roomId}
          title={dayStartNextAction === "night" ? `Phán quyết - Ngày ${dayNumber}` : `Bình Minh - Ngày ${dayNumber}`}
          onBack={onBack}
        />

        {/* Main Content Viewport */}
        <div ref={containerRef} className="flex-1 w-full relative overflow-hidden flex items-center justify-center pointer-events-none">
          <div
            className="flex flex-col items-center justify-center text-center pointer-events-none"
            style={{
              width: "800px",
              height: "380px",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Title block */}
            <div className="mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]">
              <h1 
                className="font-gothic-label text-2xl sm:text-3xl md:text-4xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon"
                style={{ 
                  textShadow: "0 0 12px rgba(225,199,165,0.25), 0 2px 4px rgba(0,0,0,0.9)",
                  color: "#e1c7a5"
                }}
              >
                BÌNH MINH LÊN
              </h1>
              <p className="font-gothic-body text-[#829ea2]/80 text-[10px] sm:text-xs italic leading-tight mt-1.5">
                Các sự kiện xảy ra trong đêm qua được công bố:
              </p>
            </div>

            {/* Victim Display Board */}
            <div className="w-[380px] min-h-[100px] flex flex-col justify-center items-center gap-2 mb-6">
              {deathsThisNight.length > 0 ? (
                deathsThisNight.map(userId => {
                  const victim = players.find(p => p.userId === userId);
                  return (
                    <div 
                      key={userId} 
                      className="w-full flex items-center gap-3 bg-[#3b1c26]/30 border border-[#5a1d2e]/45 px-4 py-2 rounded-lg shadow-md animate-fade-in"
                    >
                      <span className="text-xl filter grayscale opacity-60">💀</span>
                      <div className="flex-1 text-left">
                        <span className="font-gothic-label text-red-400 text-sm sm:text-base font-black uppercase tracking-wider block">
                          {victim?.name || "Người chơi ẩn danh"}
                        </span>
                        <span className="text-[#829ea2]/60 text-[10px] sm:text-xs font-gothic-body italic">
                          đã bị sát hại và loại khỏi cuộc chơi
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/25 px-5 py-3 rounded-lg shadow-md animate-fade-in justify-center">
                  <span className="text-xl">🕊️</span>
                  <span className="font-gothic-label text-emerald-400 text-xs sm:text-sm font-black uppercase tracking-widest">
                    Đêm qua là một đêm bình yên, không ai chết cả!
                  </span>
                </div>
              )}
            </div>

            {/* Action Controller */}
            <div className="pointer-events-auto">
              {isHost && onStartVoting ? (
                <button
                  onClick={onStartVoting}
                  className="relative w-[220px] h-[52px] hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer group"
                >
                  {/* Double-bordered Gothic Plaque Banner */}
                  <svg 
                    width="220" 
                    height="32" 
                    viewBox="0 0 220 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-[10px] left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  >
                    <defs>
                      <linearGradient id="plaqueGradDay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4d1b28" />
                        <stop offset="100%" stopColor="#250d14" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 12 2 L 208 2 L 214 8 L 214 10 L 220 16 L 214 22 L 214 24 L 208 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z" 
                      fill="url(#plaqueGradDay)" 
                      stroke="#cda372" 
                      strokeWidth="1.5" 
                    />
                    <path 
                      d="M 13 4 L 207 4 L 212 9 L 212 11 L 217 16 L 212 21 L 212 23 L 207 28 L 13 28 L 8 23 L 8 21 L 3 16 L 8 11 L 8 9 Z" 
                      stroke="#cda372" 
                      strokeWidth="0.5" 
                      strokeOpacity="0.8" 
                      fill="none"
                    />
                  </svg>

                  {/* Combined Text Left */}
                  <span 
                    className="absolute left-5 top-[26px] -translate-y-1/2 font-gothic-body text-[#e1c7a5] text-xs font-black uppercase tracking-wider select-none"
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    {continueLabel}
                  </span>

                  {/* Wax Seal Right */}
                  <div 
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)] pointer-events-none"
                  >
                    <Image 
                      src="/werewolf/logo.png" 
                      alt="Wax Seal" 
                      width={44} 
                      height={44} 
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </button>
              ) : (
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-gothic-label text-[#829ea2]/65 text-[10px] sm:text-xs uppercase tracking-widest italic animate-pulse">
                  {dayStartNextAction === "night" ? "Đang chờ quản trò đưa làng vào đêm..." : "Đang chờ quản trò khởi động bỏ phiếu..."}
                </span>
                <div className="flex gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#829ea2]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
