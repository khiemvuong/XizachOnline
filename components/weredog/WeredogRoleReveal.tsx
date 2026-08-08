"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import WeredogHeader from "./WeredogHeader";
import AvatarDisplay from "@/components/shared/AvatarDisplay";

interface Player {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isModerator: boolean;
  avatarUrl?: string | null;
  isReady?: boolean;
  role?: string;
  isSpectator?: boolean;
}

interface WeredogRoleRevealProps {
  myRole: string; // e.g. "Wolf", "Seer", "Villager"
  onReady?: () => void;
  roomId?: string;
  readyCount?: number;
  totalPlayers?: number;
  hasClickedReady?: boolean;
  onBack?: () => void;
  isHost?: boolean;
  players?: Player[];
}

const getRoleNameVi = (role?: string) => {
  if (!role) return "Dân Làng";
  if (role === "Wolf") return "Chó Sói";
  if (role === "Bodyguard") return "Bảo Vệ";
  if (role === "Seer") return "Tiên Tri";
  if (role === "Witch") return "Phù Thủy";
  if (role === "Hunter") return "Thợ Săn";
  if (role === "Cupid") return "Cupid";
  if (role === "Elder") return "Già Làng";
  if (role === "Silence") return "Tĩnh Lặng";
  return "Dân Làng";
};

export default function WeredogRoleReveal({
  myRole,
  onReady,
  roomId,
  readyCount,
  totalPlayers,
  hasClickedReady,
  onBack,
  isHost = false,
  players = [],
}: WeredogRoleRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [localReady, setLocalReady] = useState(false);

  const activeReady = hasClickedReady !== undefined ? hasClickedReady : localReady;
  const activeCount = readyCount !== undefined ? readyCount : 1;
  const activeTotal = totalPlayers !== undefined ? totalPlayers : 8;

  const roleKey = (myRole || "Villager").toLowerCase();

  // Role Metadata: Composed NFC Vietnamese diacritics
  const roleDetails: Record<string, { title: string; desc: string }> = {
    seer: {
      title: "TIÊN TRI",
      desc: "Mỗi đêm, bạn được soi căn tính thật sự của một người chơi khác. Hãy khôn ngoan dẫn dắt dân làng tìm ra kẻ thù bằng tri thức của mình.",
    },
    wolf: {
      title: "MA SÓI",
      desc: "Đồng lòng đi săn dân làng mỗi đêm cùng bầy đàn. Hãy khéo léo ẩn mình vào ban ngày để tránh bị treo cổ.",
    },
    werewolf: {
      title: "MA SÓI",
      desc: "Đồng lòng đi săn dân làng mỗi đêm cùng bầy đàn. Hãy khéo léo ẩn mình vào ban ngày để tránh bị treo cổ.",
    },
    bodyguard: {
      title: "BẢO VỆ",
      desc: "Lựa chọn một mục tiêu để canh gác mỗi đêm. Bạn không được bảo vệ cùng một người hai đêm liên tiếp.",
    },
    witch: {
      title: "PHÙ THỦY",
      desc: "Sở hữu hai bình thuốc cổ: cứu sống nạn nhân bị Sói cắn hoặc độc sát kẻ nghi ngờ. Mỗi bình chỉ dùng một lần.",
    },
    hunter: {
      title: "THỢ SĂN",
      desc: "Khi ngã xuống trong đêm hoặc bị treo cổ, bạn có quyền bắn chỉ định một mục tiêu cùng kéo xuống mộ.",
    },
    cupid: {
      title: "CUPID",
      desc: "Ngay đêm đầu tiên, bạn sẽ kết tơ hồng ghép đôi hai người bất kỳ. Nếu một trong hai chết, người kia sẽ chết theo.",
    },
    elder: {
      title: "GIÀ LÀNG",
      desc: "Linh hồn làng cổ vĩ đại có khả năng sống sót sau lần cắn đầu tiên của Sói. Nếu dân làng treo cổ bạn, tất cả sẽ mất chức năng.",
    },
    villager: {
      title: "DÂN LÀNG",
      desc: "Bạn không có chức năng thức dậy ban đêm. Hãy thu thập thông tin thảo luận ban ngày để suy đoán và treo cổ bầy sói.",
    },
    silence: {
      title: "TĨNH LẶNG",
      desc: "Bạn không có chức năng thức dậy ban đêm. Hãy lắng nghe, quan sát và bỏ phiếu cùng phe Dân vào ban ngày.",
    },
  };

  const currentRole = roleDetails[roleKey] || roleDetails.villager;

  const getRoleImage = (key: string) => {
    if (key === "seer") return "/werewolf/card/seer1.jpg";
    if (key === "wolf" || key === "werewolf") return "/werewolf/card/werewolf1.jpg";
    if (key === "bodyguard") return "/werewolf/card/bodyguard1.jpg";
    if (key === "witch") return "/werewolf/card/witch1.jpg";
    if (key === "hunter") return "/werewolf/card/hunter1.jpg";
    if (key === "cupid") return "/werewolf/card/cupid1.jpg";
    if (key === "elder") return "/werewolf/card/elder1.jpg";
    return "/werewolf/card/villager1.jpg"; // Default
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 420,
    padding: 4,
    minScale: 0.4,
    maxScale: 2.2, // Allow zoom up to 2.2x on desktop screens
  });

  // ─── Host (Moderator) Dashboard View ───
  if (isHost) {
    return (
      <div 
        className="relative w-full h-dvh overflow-hidden bg-cover bg-center text-center flex flex-col justify-between select-none"
        style={{ backgroundImage: "url('/werewolf/role_reveal_bg1.png')" }}
      >
        {/* Background vignette */}
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10" />

        {/* Top Header Bar */}
        <WeredogHeader roomId={roomId} title="HỒ SƠ VAI TRÒ" onBack={onBack} />

        {/* Main Content */}
        <div ref={containerRef} className="w-full flex-1 overflow-hidden flex items-center justify-center pointer-events-none select-none z-20">
          <div
            className="flex flex-col items-center justify-center gap-3 pointer-events-auto w-full max-w-3xl px-6"
            style={{
              width: "800px",
              height: "420px",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Title */}
            <div className="text-center mb-1 select-none">
              <h2 className="font-serif italic font-extrabold text-[#e1c7a5] text-2xl sm:text-3xl tracking-wide text-shadow-maroon leading-none">
                HỒ SƠ VAI TRÒ
              </h2>
              <p className="font-serif italic text-[#829ea2]/60 text-[10px] sm:text-xs tracking-wider mt-1.5 uppercase">
                (Dành riêng cho Quản trò — Vui lòng không chia sẻ màn hình này)
              </p>
            </div>

            {/* Premium Container Board */}
            <div className="w-full bg-black/55 border border-[#445257]/30 rounded-2xl p-4 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)] backdrop-blur-md">
              {/* Grid of Players and Roles */}
              <div className="w-full max-h-[200px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pr-1 scrollbar-thin scrollbar-thumb-[#cda372]/30 scrollbar-track-transparent">
                {players.filter(p => !p.isModerator && !p.isSpectator).map((p) => {
                  const isPlayerReady = p.isReady;
                  const roleName = getRoleNameVi(p.role);
                  
                  const roleColors = 
                    p.role === "Wolf" ? { text: "text-rose-300", bg: "bg-rose-950/50 border border-rose-800/40" } :
                    p.role === "Bodyguard" ? { text: "text-sky-300", bg: "bg-sky-950/50 border border-sky-800/40" } :
                    p.role === "Seer" ? { text: "text-cyan-300", bg: "bg-cyan-950/50 border border-cyan-800/40" } :
                    p.role === "Witch" ? { text: "text-emerald-300", bg: "bg-emerald-950/50 border border-emerald-800/40" } :
                    p.role === "Hunter" ? { text: "text-amber-300", bg: "bg-amber-950/50 border border-amber-800/40" } :
                    p.role === "Cupid" ? { text: "text-pink-300", bg: "bg-pink-950/50 border border-pink-800/40" } :
                    p.role === "Elder" ? { text: "text-purple-300", bg: "bg-purple-950/50 border border-purple-800/40" } :
                    p.role === "Silence" ? { text: "text-slate-200", bg: "bg-slate-950/70 border border-slate-500/50" } :
                    { text: "text-slate-300", bg: "bg-slate-900/60 border border-slate-700/40" };

                  return (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between bg-linear-to-b from-[#1b1c22]/95 to-[#0d0e12]/95 border border-[#829ea2]/25 rounded-xl p-2 gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-[#cda372]/45 transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {/* Avatar display with small border */}
                        <div className="w-8 h-8 rounded-full border border-[#829ea2]/35 flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-inner">
                          {p.avatarUrl ? (
                            <AvatarDisplay avatarUrl={p.avatarUrl} name={p.name} size={32} />
                          ) : (
                            <span className="font-serif font-bold text-[#cdd6d8]">
                              {p.avatar || p.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Name and role badge */}
                        <div className="flex flex-col text-left overflow-hidden gap-1">
                          <span className="font-serif font-bold text-xs text-[#cdd6d8] truncate w-[90px]">
                            {p.name}
                          </span>
                          <div className="flex">
                            <span className={`font-serif text-[8px] uppercase tracking-wide font-black px-1.5 py-0.5 rounded-sm ${roleColors.text} ${roleColors.bg}`}>
                              {roleName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ready status */}
                      <div className="shrink-0 pr-1 select-none font-serif">
                        {isPlayerReady ? (
                          <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/25 px-1.5 py-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.15)] flex items-center gap-0.5" title="Đã xem xong">
                            ✓ SẴN SÀNG
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-950/30 border border-amber-500/25 px-1.5 py-1 rounded shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse flex items-center gap-0.5" title="Đang xem">
                            ⏳ ĐANG XEM
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting status bar */}
            <div className="w-[340px] mt-2 flex flex-col items-center gap-2 font-serif select-none">
              <div className="w-full h-1 bg-[#445257]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-[#cda372] to-[#829ea2] transition-all duration-500" 
                  style={{ width: `${(activeCount / activeTotal) * 100}%` }}
                />
              </div>
              <span className="text-[#829ea2] text-[10px] uppercase tracking-widest font-bold animate-pulse">
                {activeCount === activeTotal ? "Đang chuyển sang đêm..." : `Đang chờ người chơi: ${activeCount}/${activeTotal} đã sẵn sàng`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Player View (Illustrative Card & Ready Check) ───
  return (
    <div 
      className="relative w-full h-dvh overflow-hidden bg-cover bg-center text-center flex flex-col justify-between select-none"
      style={{ backgroundImage: "url('/werewolf/role_reveal_bg1.png')" }}
    >
      {/* Background vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10" />

      {/* Top Header Bar */}
      <WeredogHeader roomId={roomId} title="Xem Vai Trò" onBack={onBack} />

      {/* Main Container */}
      <div ref={containerRef} className="w-full flex-1 overflow-hidden flex items-center justify-center pointer-events-none select-none z-20">
        <div
          className="flex flex-row items-center justify-center gap-8 md:gap-14 pointer-events-none"
          style={{
            width: "800px",
            height: "420px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Left Column: The Flippable Card */}
          <div className="flex items-center justify-center pointer-events-auto">
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-[175px] perspective-1000 cursor-pointer relative group transition-transform duration-300 hover:scale-[1.03]"
              style={{ aspectRatio: "347 / 617" }}
            >
              <div 
                className={`w-full h-full duration-700 transform-style-3d relative ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side: Card Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden shadow-2xl border border-[#445257]/30">
                  <Image 
                    src="/werewolf/card/back_card1.jpg"
                    alt="Card Back"
                    fill
                    sizes="200px"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Back Side: Role illustration */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-2xl border border-[#cda372]/50">
                  {roleKey === "silence" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#111820] px-5 text-center text-[#d5e0e2]">
                      <span className="font-gothic-label text-[11px] tracking-[0.35em] text-[#829ea2]">VAI TRÒ</span>
                      <strong className="mt-4 font-gothic-heading text-3xl tracking-[0.18em]">TĨNH<br />LẶNG</strong>
                      <span className="mt-5 font-gothic-body text-[10px] leading-relaxed text-[#829ea2]">Không có hành động ban đêm.</span>
                    </div>
                  ) : (
                    <Image
                      src={getRoleImage(roleKey)}
                      alt={currentRole.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Text & Confirm Button */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm md:max-w-md space-y-1 pointer-events-auto">
            <h2 
              className="font-gothic-label text-[#e1c7a5] text-3xl sm:text-4xl md:text-5xl tracking-widest uppercase select-none font-bold transition-all duration-300"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}
            >
              {isFlipped ? currentRole.title : "MỆNH VẬN"}
            </h2>
            
            {/* Description box */}
            <div className="h-[64px] sm:h-[72px] md:h-[80px] w-full flex items-center justify-center md:justify-start overflow-hidden">
              <p 
                className="font-bold font-gothic-body text-[#829ea2] text-md sm:text-md md:text-md leading-relaxed transition-all duration-300"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                {isFlipped 
                  ? currentRole.desc 
                  : "Chạm vào lá bài cổ ở bên trái để lật mở thân phận thực sự của bạn tại Dog Village tối nay. Hãy bảo mật tuyệt đối vai trò này..."
                }
              </p>
            </div>

            {/* Hint Box */}
            <div className="h-5 flex items-center">
              {!isFlipped && (
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#829ea2]/45 animate-pulse font-gothic-label flex items-center gap-1.5 self-center md:self-start">
                  <span className="text-sm">←</span> Nhấp vào lá bài để xem vai trò
                </div>
              )}
            </div>

            {/* Ready Button & Count display */}
            {onReady && (
              <div className="pt-2 md:pt-4 flex flex-col items-center md:items-start gap-3 w-full">
                <button 
                  onClick={() => {
                    setLocalReady(true);
                    onReady();
                  }}
                  disabled={activeReady}
                  className={`relative w-[240px] h-[68px] transition-all duration-200 group ${
                    activeReady 
                      ? "pointer-events-none opacity-90 scale-95" 
                      : "hover:scale-[1.03] active:scale-95 cursor-pointer"
                  }`}
                >
                  <svg 
                    width="240" 
                    height="40" 
                    viewBox="0 0 240 40" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-[14px] left-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  >
                    <defs>
                      <linearGradient id="plaqueGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4d1b28" />
                        <stop offset="100%" stopColor="#250d14" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 14 2 L 226 2 L 232 8 L 232 10 L 240 20 L 232 30 L 232 32 L 226 38 L 14 38 L 8 32 L 8 30 L 0 20 L 8 10 L 8 8 Z" 
                      fill="url(#plaqueGrad2)" 
                      stroke="#cda372" 
                      strokeWidth="1.5" 
                    />
                    <path 
                      d="M 15 4 L 225 4 L 230 9 L 230 11 L 237 20 L 230 29 L 230 31 L 225 36 L 15 36 L 10 29 L 10 31 L 3 20 L 10 11 L 10 9 Z" 
                      stroke="#cda372" 
                      strokeWidth="0.5" 
                      strokeOpacity="0.8" 
                    />
                  </svg>

                  <span 
                    className={`absolute left-[16px] w-[140px] text-center top-[34px] -translate-y-1/2 font-gothic-body text-base md:text-lg font-bold italic tracking-wider select-none transition-all duration-300 ${
                      activeReady ? "text-[#829ea2] animate-pulse" : "text-[#e1c7a5]"
                    }`}
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    {activeReady ? "Chờ..." : "Rồi hiểu rồi"}
                  </span>

                  <div 
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.8)] overflow-hidden z-10 transition-all ${
                      activeReady 
                        ? "shadow-[0_0_12px_rgba(130,158,162,0.4)]" 
                        : "group-hover:shadow-[0_0_18px_rgba(205,163,114,0.5)]"
                    }`}
                  >
                    <Image 
                      src="/werewolf/logo.png" 
                      alt="Wax Seal" 
                      width={64} 
                      height={64} 
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </button>

                {/* Progress Indicator */}
                <div className="w-[240px] mt-2 flex flex-col items-center md:items-start gap-1.5 animate-fade-in">
                  <div className="w-full h-1 bg-[#445257]/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-[#cda372] to-[#829ea2] transition-all duration-500" 
                      style={{ width: `${(activeCount / activeTotal) * 100}%` }}
                    />
                  </div>
                  <span className="font-gothic-label text-[#829ea2] text-[10px] sm:text-[11px] uppercase tracking-widest">
                    {activeCount === activeTotal ? "Tất cả đã sẵn sàng!" : `${activeCount}/${activeTotal} người chơi đã sẵn sàng`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
