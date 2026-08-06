"use client";

import AvalonBoard from "./board/AvalonBoard";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { useViewportMode } from "@/hooks/useViewportMode";

export default function MobileLandscapeShell({ roomId }: { roomId: string }) {
  const { isLandscape, isMobile } = useViewportMode();

  useScreenWakeLock({
    enabled: isMobile,
    mobileOnly: false,
  });

  return (
    <main
      className={`avalon-orientation-lock flex flex-col w-full h-dvh overflow-hidden ${
        isMobile && isLandscape ? "avalon-mobile-landscape" : ""
      }`}
    >
      <div className="relative flex-1 min-h-0">
        {/* Portrait blocker — only shown on mobile portrait */}
        {isMobile && !isLandscape && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md px-8 text-center">
            <div className="text-5xl mb-6">↻</div>
            <h2 className="text-white font-headline text-xl md:text-2xl uppercase tracking-widest mb-3">
              Vui lòng xoay ngang điện thoại
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Giao diện game được thiết kế riêng cho màn hình ngang.
            </p>
          </div>
        )}

        {/* Game content — always mounted so socket stays alive */}
        <div className={`w-full h-full ${isMobile && !isLandscape ? "invisible" : ""}`}>
          <AvalonBoard roomId={roomId} />
        </div>
      </div>
    </main>
  );
}
