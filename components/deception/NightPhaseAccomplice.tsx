"use client";

import { ArrowLeft, Skull } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";

// ─── Small decorative pin ────────────────────────────────────────────────────

function Pin({ className }: { className?: string }) {
  return (
    <div
      className={`absolute h-3 w-3 rounded-full border border-[#333537] bg-linear-to-br from-[#37393b] to-[#ad8888] shadow-md ${className ?? ""}`}
    >
      <div className="absolute inset-[2px] rounded-full bg-linear-to-tl from-[#1e2022] to-[#37393b]" />
    </div>
  );
}

export default function NightPhaseAccomplice({
  gameState,
  // me: _me,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onExit: () => void;
}) {
  const murderer = gameState.players.find((p) => p.role === "Murderer");

  return (
    <div className="deception-room-bg deception-theme relative flex h-dvh flex-col overflow-hidden">
      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-[#121416] via-[#121416] to-[rgba(255,45,85,0.1)] opacity-90 mix-blend-multiply" />
        <div className="absolute right-0 top-0 h-[60%] w-full translate-x-1/4 -translate-y-1/3 rounded-full bg-[rgba(255,177,183,0.2)] blur-[130px] mix-blend-screen md:w-1/2" />
      </div>

      {/* Back button */}
      <button
        onClick={onExit}
        className="deception-icon-btn absolute right-4 top-4 z-20 h-7 w-7"
        title="Thoát"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>

      {/* Content */}
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 md:px-8 lg:px-16">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-center landscape:max-lg:h-[130vw] landscape:max-lg:w-[200vw]">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-6 landscape:max-lg:grid-cols-12 landscape:max-lg:gap-8 landscape:max-lg:origin-center landscape:max-lg:scale-[0.95] lg:grid-cols-12 lg:gap-16">
          {/* Left: text */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center landscape:max-lg:col-span-5 landscape:max-lg:items-start landscape:max-lg:text-left lg:col-span-5 lg:items-start lg:text-left">
            <div className="mb-3 inline-flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse bg-[#ffb3b5] shadow-[0_0_8px_#ffb3b5]" />
              <span className="font-[Be_Vietnam_Pro,sans-serif] text-[10px] font-bold uppercase tracking-[0.3em] text-[#ffb3b5]">
                Kênh Bí Mật Alpha
              </span>
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.85] tracking-tighter text-[#e2e2e5] [text-shadow:0_0_20px_rgba(255,81,103,0.4)] sm:text-5xl md:text-6xl lg:text-[5rem]">
              HIỆP ƯỚC
              <br />
              <span className="mt-4 block text-[#ffb3b5] opacity-90 drop-shadow-[0_0_15px_rgba(255,45,85,0.4)]">
                ĐÃ ĐƯỢC KÝ KẾT
              </span>
            </h1>

            <div className="mx-auto my-4 h-px w-16 bg-linear-to-r from-[#ffb3b5] to-transparent opacity-70 md:my-6 md:w-24 lg:mx-0" />

            <p className="max-w-xs border-l-2 border-[rgba(255,177,183,0.4)] pl-3 py-1 font-[Work_Sans,sans-serif] text-sm italic leading-relaxed text-[#e6bcbd] opacity-90 md:text-base">
              &quot;Kế hoạch đang vận hành. Hãy dẫn dắt đội pháp y theo vết bóng tối cho đến bình minh.&quot;
            </p>

            {/* Desktop sticky note */}
            <div className="absolute -bottom-28 left-6 z-20 hidden w-52 -rotate-[4deg] border border-[rgba(93,63,64,0.1)] bg-[#ffdea8] p-4 shadow-[0_10px_40px_-5px_rgba(18,20,22,0.8)] lg:block">
              <Pin className="-left-1.5 -top-1.5" />
              <div className="absolute left-0 top-2.5 h-px w-full bg-black/10" />
              <p className="pt-2 font-[Work_Sans,sans-serif] text-[13px] font-medium leading-relaxed text-[#271900]">
                Chỉ thị: Hủy bằng chứng trước khi bị phát hiện. Không để lại dấu vết.
              </p>
            </div>
          </div>

          {/* Right: dossier card */}
          <div className="relative z-20 mx-auto w-full max-w-xl landscape:max-lg:col-span-7 lg:col-span-7 lg:mr-0">
            <div className="h-px w-16 bg-[rgba(255,177,183,0.3)] absolute top-[40%] -left-16 z-0 hidden lg:block" />

            <div className="w-full border border-[rgba(93,63,64,0.15)] bg-[rgba(51,53,55,0.4)] p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-[30px] md:p-3">
              <div className="relative border border-[rgba(93,63,64,0.1)] bg-[#333537] p-4 md:p-7">
                {/* REC badge */}
                <div className="absolute right-4 top-0 flex h-4 w-8 items-center justify-center border-b border-l border-r border-[rgba(93,63,64,0.2)] bg-[rgba(255,177,183,0.1)] md:h-5 md:w-12 md:right-5">
                  <span className="font-mono text-[7px] font-bold text-[#ffb3b5] md:text-[9px]">REC</span>
                </div>

                {/* Mastermind header */}
                <div className="mb-5 flex items-end justify-between border-b border-[rgba(93,63,64,0.2)] pb-3 md:mb-8 md:pb-4">
                  <div>
                    <span className="mb-1 block font-[Be_Vietnam_Pro,sans-serif] text-[8px] uppercase tracking-[0.3em] text-[#ffb3b5] md:text-[10px]">
                      Kẻ Chủ Mưu
                    </span>
                    <h3 className="font-[Space_Grotesk,sans-serif] text-2xl font-black uppercase tracking-tight text-[#e2e2e5] sm:text-3xl lg:text-4xl">
                      {murderer?.name || "ẨN DANH"}
                    </h3>
                  </div>
                  <div className="mb-1 border border-[rgba(93,63,64,0.1)] bg-[#121416] px-2 py-1 font-mono text-[9px] text-[#ad8888] md:text-xs">
                    ID: X-{gameState.id.slice(0, 3).toUpperCase()}
                  </div>
                </div>

                {/* Status message */}
                <div className="mb-5 rounded-none border border-[rgba(255,177,183,0.2)] bg-[rgba(255,45,85,0.05)] p-3 md:mb-8">
                  <p className="font-[Work_Sans,sans-serif] text-sm leading-relaxed text-[#e6bcbd]">
                    Chờ kẻ chủ mưu chốt phương án gây án. Nhiệm vụ của bạn là{" "}
                    <strong className="text-[#ffb3b5]">bảo vệ hắn trước điều tra viên</strong>.
                  </p>
                </div>

                {/* Confirm button */}
                <button className="group/btn relative flex w-full items-center justify-center gap-2 border border-[rgba(255,177,183,0.2)] bg-[#0c0e10] py-3 font-[Space_Grotesk,sans-serif] text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b5] transition-all duration-300 hover:border-[#ffb3b5] hover:bg-[rgba(255,177,183,0.1)] md:py-4 md:text-sm">
                  <span className="relative z-10">Xác Nhận Đồng Lõa</span>
                  <Skull className="relative z-10 h-3 w-3 opacity-40 transition-opacity group-hover/btn:opacity-100 md:h-4 md:w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile sticky note (portrait only) */}
          <div className="flex justify-center landscape:hidden lg:hidden">
            <div className="relative w-52 rotate-3 border border-[rgba(93,63,64,0.1)] bg-[#ffdea8] p-3 shadow-[0_10px_40px_-5px_rgba(18,20,22,0.8)]">
              <Pin className="-top-1.5 left-1/2 -translate-x-1/2" />
              <p className="pt-1.5 text-center font-[Work_Sans,sans-serif] text-[11px] font-medium leading-relaxed text-[#271900]">
                Chỉ thị: Hủy bằng chứng trước khi bị phát hiện.
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
