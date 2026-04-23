"use client";

import { ArrowLeft } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";

export default function NightPhaseInvestigator({
  // gameState,
  // me: _me,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onExit: () => void;
}) {
  return (
    <div className="deception-room-bg deception-theme relative flex h-dvh flex-col overflow-hidden">
      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient BG layer */}
      <div className="absolute inset-0 z-0 bg-linear-to-b from-[#0c0e10] via-[#121416] to-[#0c0e10]">
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(1)",
          }}
        />
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
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Large icon */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center opacity-80 mix-blend-screen sm:h-40 sm:w-40">
          <div className="absolute inset-0 rounded-full bg-[rgba(0,210,253,0.1)] blur-[60px]" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="h-full w-full text-[#a2e7ff] drop-shadow-[0_0_15px_rgba(162,231,255,0.4)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase leading-none tracking-tighter text-[#e2e2e5] opacity-90 sm:text-6xl">
            NGỦ YÊN...{" "}
            <br />
            <span className="text-[#a2e7ff]/70">ĐÊM NAY</span>
          </h1>

          <div className="relative inline-block">
            <div className="absolute -inset-x-6 -inset-y-3 -z-10 bg-[rgba(51,53,55,0.4)] backdrop-blur-sm" />
            <div className="absolute -left-6 -right-6 top-[-12px] h-px bg-[rgba(93,63,64,0.2)]" />
            <p className="font-[Work_Sans,sans-serif] text-base font-medium tracking-wide text-[#e6bcbd] sm:text-lg">
              Thành phố im lặng.
              <br className="sm:hidden" />
              {" "}Đợi manh mối đầu tiên xuất hiện lúc bình minh.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
