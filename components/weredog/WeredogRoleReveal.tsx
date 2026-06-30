"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import WeredogHeader from "./WeredogHeader";

interface WeredogRoleRevealProps {
  myRole: string; // e.g. "Wolf", "Seer", "Villager"
  onReady?: () => void;
  roomId?: string;
}

export default function WeredogRoleReveal({ myRole, onReady, roomId }: WeredogRoleRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [readyCount, setReadyCount] = useState(1);
  const [hasClickedReady, setHasClickedReady] = useState(false);

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
    villager: {
      title: "DÂN LÀNG",
      desc: "Bạn không có năng lực đặc biệt, nhưng lá phiếu biểu quyết của bạn chính là vũ khí mạnh nhất để tiêu diệt lũ sói dữ.",
    },
    bodyguard: {
      title: "BẢO VỆ",
      desc: "Mỗi đêm, bạn chọn bảo vệ một người chơi khỏi sự cắn xé của Ma Sói. Không thể tự bảo vệ bản thân hoặc bảo vệ một người hai đêm liên tiếp.",
    },
    witch: {
      title: "PHÙ THỦY",
      desc: "Nắm giữ hai bình thuốc ma thuật: một bình cứu sống nạn nhân bị cắn đêm nay, một bình độc sát một kẻ tình nghi.",
    },
    hunter: {
      title: "THỢ SĂN",
      desc: "Khi bị hạ gục, bạn có quyền bắn một phát súng cuối cùng để kéo một kẻ tình nghi bất kỳ cùng ngã xuống.",
    },
    elder: {
      title: "GIÀ LÀNG",
      desc: "Già làng đáng kính gánh chịu được 2 lần cắn của sói mới chết. Nếu bị dân làng treo cổ, mọi người chơi đặc biệt khác sẽ mất hết chức năng.",
    },
  };

  const currentRole = roleDetails[roleKey] || roleDetails.villager;

  const getRoleImage = (role: string) => {
    const key = role.toLowerCase();
    if (key === "wolf" || key === "werewolf") return "/werewolf/card/werewolf1.jpg";
    if (key === "seer") return "/werewolf/card/seer1.jpg";
    if (key === "bodyguard") return "/werewolf/card/bodyguard1.jpg";
    if (key === "witch") return "/werewolf/card/witch1.jpg";
    if (key === "hunter") return "/werewolf/card/hunter1.jpg";
    if (key === "elder") return "/werewolf/card/elder1.jpg";
    return "/werewolf/card/villager1.jpg"; // Default
  };

  // Click handler with ready state simulation
  const handleReadyClick = () => {
    if (hasClickedReady) return;
    setHasClickedReady(true);
    setReadyCount(2);

    let current = 2;
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 2) + 1; // 1 or 2
      current = Math.min(8, current + increment);
      setReadyCount(current);
      if (current >= 8) {
        clearInterval(interval);
        setTimeout(() => {
          if (onReady) onReady();
        }, 800);
      }
    }, 500);
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
      className="relative w-full h-dvh overflow-hidden bg-cover bg-center text-center flex flex-col justify-between select-none"
      style={{ backgroundImage: "url('/werewolf/role_reveal_bg1.png')" }}
    >
      {/* Background vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10" />

      {/* Top Header Bar */}
      <WeredogHeader roomId={roomId} title="Xem Vai Trò" />

      {/* Main Container */}
      <div ref={containerRef} className="w-full flex-1 overflow-hidden flex items-center justify-center pointer-events-none select-none z-20">
        <div
          className="flex flex-row items-center justify-center gap-8 md:gap-14 pointer-events-none"
          style={{
            width: "800px",
            height: "380px",
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
                  <Image 
                    src={getRoleImage(roleKey)}
                    alt={currentRole.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
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
            
            {/* Skeleton-styled fixed-height description box to prevent jumping */}
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

            {/* Fixed-height Hint / Spacer box to prevent jumping */}
            <div className="h-5 flex items-center">
              {!isFlipped && (
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#829ea2]/45 animate-pulse font-gothic-label flex items-center gap-1.5 self-center md:self-start">
                  <span className="text-sm">←</span> Nhấp vào lá bài để xem vai trò
                </div>
              )}
            </div>

            {/* Redesigned Larger Ready Button & Count display (Always visible) */}
            {onReady && (
              <div className="pt-2 md:pt-4 flex flex-col items-center md:items-start gap-3 w-full">
                <button 
                  onClick={handleReadyClick}
                  disabled={hasClickedReady}
                  className={`relative w-[240px] h-[68px] transition-all duration-200 group ${
                    hasClickedReady 
                      ? "pointer-events-none opacity-90 scale-95" 
                      : "hover:scale-[1.03] active:scale-95 cursor-pointer"
                  }`}
                >
                  {/* Redesigned Larger Double-bordered Gothic Plaque Banner */}
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
                    
                    {/* Outer Plaque Background & Gold Border */}
                    <path 
                      d="M 14 2 L 226 2 L 232 8 L 232 10 L 240 20 L 232 30 L 232 32 L 226 38 L 14 38 L 8 32 L 8 30 L 0 20 L 8 10 L 8 8 Z" 
                      fill="url(#plaqueGrad2)" 
                      stroke="#cda372" 
                      strokeWidth="1.5" 
                    />
                    
                    {/* Inner Accent Gold Border */}
                    <path 
                      d="M 15 4 L 225 4 L 230 9 L 230 11 L 237 20 L 230 29 L 230 31 L 225 36 L 15 36 L 10 29 L 10 31 L 3 20 L 10 11 L 10 9 Z" 
                      stroke="#cda372" 
                      strokeWidth="0.5" 
                      strokeOpacity="0.8" 
                    />
                  </svg>

                  {/* "Hiểu rồi" / "Đã sẵn sàng" Text Left */}
                  <span 
                    className={`absolute left-[16px] w-[140px] text-center top-[34px] -translate-y-1/2 font-gothic-body text-base md:text-lg font-bold italic tracking-wider select-none transition-all duration-300 ${
                      hasClickedReady ? "text-[#829ea2] animate-pulse" : "text-[#e1c7a5]"
                    }`}
                    style={{ textShadow: "0 1.5px 3px rgba(0,0,0,0.8)" }}
                  >
                    {hasClickedReady ? "Chờ..." : "Rồi hiểu rồi"}
                  </span>

                  {/* Center-Right Large Wax Seal Image (logo.png) */}
                  <div 
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.8)] overflow-hidden z-10 transition-all ${
                      hasClickedReady 
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

                {/* Progress and Count Indicator */}
                <div className="w-[240px] mt-2 flex flex-col items-center md:items-start gap-1.5 animate-fade-in">
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#445257]/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-[#cda372] to-[#829ea2] transition-all duration-500" 
                      style={{ width: `${(readyCount / 8) * 100}%` }}
                    />
                  </div>
                  {/* Progress text */}
                  <span className="font-gothic-label text-[#829ea2] text-[10px] sm:text-[11px] uppercase tracking-widest">
                    {readyCount === 8 ? "Tất cả đã sẵn sàng!" : `${readyCount}/8 người chơi đã sẵn sàng`}
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
