"use client";

import { ArrowLeft, Hourglass } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NightPhaseForensic({
  gameState,
  // me: _me,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onExit: () => void;
}) {
  const hasSelected = !!gameState.murderSelection && !!gameState.murderSelection.meansId;
  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(12,14,16,0.85)_100%)]" />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-[rgba(162,231,255,0.08)] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a2e7ff] shadow-[0_0_6px_#a2e7ff]" />
          <span className="font-[Space_Grotesk,sans-serif] text-[10px] font-black uppercase tracking-[0.3em] text-[#a2e7ff]">
            PHÁP Y GIÁM ĐỊNH
          </span>
        </div>
        <button onClick={onExit} className="deception-icon-btn h-7 w-7" title="Thoát">
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 px-4 py-3">
        {/* Headline */}
        <div className="flex shrink-0 flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-[#e2e2e5] opacity-90 [text-shadow:0_0_20px_rgba(255,81,103,0.4)] sm:text-3xl">
            LỜI NÓI THẬT CỦA HIỆN TRƯỜNG
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#a2e7ff] opacity-70">
            Night Phase — Forensic Scientist Protocol Active
          </p>
        </div>

        {/* Evidence panel */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-none border border-t border-[rgba(162,231,255,0.1)] bg-[rgba(255,255,255,0.04)] backdrop-blur-sm">
          {/* Hatching pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,transparent,transparent 10px,var(--deception-cyan,#00d2fd) 10px,var(--deception-cyan,#00d2fd) 11px)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 p-3 sm:flex-row sm:gap-8 sm:p-6">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(255,81,103,0.3)] bg-[rgba(255,81,103,0.05)] shadow-[0_0_30px_rgba(255,81,103,0.15)]">
                  <div className="absolute inset-0 max-w-full max-h-full animate-ping rounded-full border border-[rgba(255,81,103,0.5)] opacity-50 duration-1000" />
                  <Hourglass className="h-10 w-10 animate-pulse text-[rgba(255,81,103,0.8)]" />
                </div>
                <h2 className="font-[Space_Grotesk,sans-serif] text-sm font-bold uppercase tracking-[0.2em] text-[#ffb3b5]">
                  Đang đợi Sát Nhân ra tay...
                </h2>
                <p className="max-w-[250px] text-xs leading-relaxed text-[#c6a3a4] opacity-80">
                  Vui lòng chờ. Quá trình gây án đang diễn ra tại hiện trường. Bạn sẽ nhận được báo cáo ngay sau khi hung thủ hoàn tất.
                </p>
              </div>
          </div>

          {/* Instruction note (only show when has cards) */}
          {hasSelected && (
            <div className="absolute -bottom-2 -right-2 z-20 max-w-[160px] rotate-3 bg-[#ffdea8] p-3 shadow-[0_10px_40px_-5px_rgba(18,20,22,0.8)] sm:-bottom-3 sm:-right-4">
              <p className="font-[Work_Sans,sans-serif] text-[11px] font-medium leading-relaxed text-[#271900]">
                Ghi nhớ sự liên kết. Dẫn dắt trực giác mà không nói thẳng sự thật.
              </p>
            </div>
          )}
        </div>

        {/* Footer status */}
        
        <div className="shrink-0 flex justify-end">
          <div className="inline-flex items-center  gap-2.5 border border-b border-[rgba(162,231,255,0.15)] bg-[rgba(12,14,16,0.8)] px-4 py-2 backdrop-blur-md">
            <Hourglass className={`h-3.5 w-3.5 animate-pulse ${hasSelected ? "text-[#afffba]" : "text-[#a2e7ff]"}`} />
            <span className={`font-[Space_Grotesk,sans-serif] text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 ${hasSelected ? "text-[#afffba]" : "text-[#a2e7ff]"}`}>
              {hasSelected ? "Phân tích hoàn tất: Đã ghi nhận hiện trường" : "Đang chờ sát nhân dàn xếp hiện trường"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
