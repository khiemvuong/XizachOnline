"use client";

import { ArrowLeft, Eye, Heart, TriangleAlert } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";

function Pin({ className }: { className?: string }) {
  return (
    <div
      className={`absolute h-3 w-3 rounded-full border border-[#333537] bg-linear-to-br from-[#37393b] to-[#9b88ad] shadow-md ${className ?? ""}`}
    >
      <div className="absolute inset-[2px] rounded-full bg-linear-to-tl from-[#1e2022] to-[#37393b]" />
    </div>
  );
}

export default function NightPhasePhantom({
  gameState,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onExit: () => void;
}) {
  const accomplice = gameState.players.find((p) => p.role === "Accomplice");
  const lover = gameState.players.find((p) => p.role === "Lover");

  return (
    <div className="deception-room-bg deception-theme relative flex h-dvh flex-col overflow-hidden">
      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Paper texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[-1] opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/black-paper.png')",
        }}
      />
      {/* Radial vignette */}
      <div className="pointer-events-none absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(18,20,22,0.9)_100%)]" />

      {/* Back button */}
      <button
        onClick={onExit}
        className="deception-icon-btn absolute right-4 top-4 z-20 h-7 w-7"
        title="Thoát"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>

      {/* Content */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-4 pb-2 md:gap-8 md:pb-6 md:px-10">
        <div className="flex w-full flex-col items-center gap-4 landscape:max-lg:w-[900px] landscape:max-lg:origin-center landscape:max-lg:scale-[0.65] md:gap-8">
        {/* Headline */}
        <h1 className="font-[Space_Grotesk,sans-serif] text-center text-4xl font-black uppercase leading-none tracking-tighter text-[#a78bfa] [text-shadow:0_0_20px_rgba(167,139,250,0.4)] mix-blend-screen md:text-6xl">
          BÓNG MA...
          <br />
          <span className="mt-1 block text-2xl uppercase tracking-widest text-[#e2e2e5] opacity-90 md:text-4xl md:mt-2">
            ĐANG QUAN SÁT
          </span>
        </h1>

        {/* Dossier card */}
        <div className="relative w-full max-w-xl rotate-1 group md:rotate-2">
          <div className="absolute -inset-4 z-0 bg-[rgba(18,20,22,0.5)] opacity-80 blur-[30px]" />

          <div className="relative z-10 flex flex-col gap-3 border border-[rgba(100,63,130,0.15)] bg-[#333537] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md md:gap-5 md:p-7">
            <Pin className="-top-3 left-1/2 -translate-x-1/2" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(100,63,130,0.3)] pb-2.5">
              <span className="font-[Be_Vietnam_Pro,sans-serif] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c4b5fd]">
                HỒ SƠ BÓNG MA
              </span>
              <span className="font-mono text-[10px] text-[#9b88ad]">
                ID: {gameState.id.slice(0, 3).toUpperCase()}-P-DUAL
              </span>
            </div>

            {/* Two profiles: Accomplice + Lover */}
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {/* Accomplice */}
              <div className="relative flex flex-col items-center gap-3 border-t-2 border-[rgba(255,186,32,0.4)] bg-[#1e2022] p-3 text-center shadow-inner group/item md:p-5">
                <div className="absolute left-3 top-3 text-[rgba(255,186,32,0.1)] transition-colors group-hover/item:text-[rgba(255,186,32,0.3)]">
                  <Eye className="h-4 w-4" />
                </div>
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border-b-2 border-[#ffba20] bg-[#121416] md:h-18 md:w-18">
                  <Eye className="relative z-10 h-7 w-7 text-[#ffba20] drop-shadow-[0_0_10px_rgba(255,186,32,0.4)] md:h-9 md:w-9" />
                  <div className="absolute inset-0 bg-[rgba(255,186,32,0.1)] mix-blend-color-burn" />
                </div>
                <div className="w-full">
                  <p className="mb-1 font-[Be_Vietnam_Pro,sans-serif] text-[9px] uppercase tracking-[0.2em] text-[#9b88ad] md:text-[10px]">
                    ĐỒNG PHẠM
                  </p>
                  <p className="border-l-4 border-[#ffba20] bg-[#282a2c] px-2 py-1 font-[Space_Grotesk,sans-serif] text-lg font-bold uppercase tracking-tight text-[#e2e2e5] md:py-2 md:text-2xl">
                    {accomplice?.name || "ẨN DANH"}
                  </p>
                </div>
              </div>

              {/* Lover */}
              <div className="relative flex flex-col items-center gap-3 border-t-2 border-[rgba(244,63,94,0.4)] bg-[#1e2022] p-3 text-center shadow-inner group/item md:p-5">
                <div className="absolute right-3 top-3 text-[rgba(244,63,94,0.1)] transition-colors group-hover/item:text-[rgba(244,63,94,0.3)]">
                  <Heart fill="currentColor" className="h-4 w-4" />
                </div>
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border-b-2 border-[#f43f5e] bg-[#121416] md:h-18 md:w-18">
                  <Heart className="relative z-10 h-7 w-7 text-[#f43f5e] drop-shadow-[0_0_10px_rgba(244,63,94,0.4)] md:h-9 md:w-9" />
                  <div className="absolute inset-0 bg-[rgba(244,63,94,0.1)] mix-blend-color-burn" />
                </div>
                <div className="w-full">
                  <p className="mb-1 font-[Be_Vietnam_Pro,sans-serif] text-[9px] uppercase tracking-[0.2em] text-[#9b88ad] md:text-[10px]">
                    TÌNH NHÂN
                  </p>
                  <p className="border-r-4 border-[#f43f5e] bg-[#282a2c] px-2 py-1 font-[Space_Grotesk,sans-serif] text-lg font-bold uppercase tracking-tight text-[#e2e2e5] md:py-2 md:text-2xl">
                    {lover?.name || "ẨN DANH"}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 border-t border-[rgba(100,63,130,0.3)] pt-3 md:pt-4">
              <TriangleAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-[#c4b5fd]"
                fill="currentColor"
              />
              <p className="font-[Work_Sans,sans-serif] text-xs leading-relaxed text-[#ddd6fe] md:text-sm">
                Bạn nhìn thấy bóng tối nhưng không biết ai cầm dao.{" "}
                <strong className="mt-1 block text-[#c4b5fd]">
                  Hãy diễn giống nhân chứng — và cầu nguyện bị săn.
                </strong>
              </p>
            </div>
          </div>

          {/* Sticky note */}
          <div className="absolute -bottom-3 -right-3 z-20 max-w-[130px] -rotate-12 border border-[rgba(100,63,130,0.2)] bg-[#e8d5ff] p-2.5 shadow-[2px_5px_15px_rgba(0,0,0,0.5)] md:-bottom-4 md:-right-6 md:max-w-[140px] md:p-3">
            <p className="font-[Work_Sans,sans-serif] text-[10px] italic leading-snug text-[#1e0040] md:text-xs">
              Bóng Ma biết đồng minh — nhưng không biết sát nhân.
            </p>
          </div>
        </div>

        {/* Recording indicator */}
        <div className="shrink-0 opacity-60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#c4b5fd] shadow-[0_0_8px_#a78bfa]" />
            <span className="font-[Be_Vietnam_Pro,sans-serif] text-[9px] uppercase tracking-[0.3em] text-[#9b88ad] md:text-[10px]">
              Giai Đoạn Ghi Nhận Đang Hoạt Động
            </span>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
