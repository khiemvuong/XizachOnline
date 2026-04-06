"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AvalonBoard from "./AvalonBoard";

export default function MobileLandscapeShell({ roomId }: { roomId: string }) {
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const isiPhone = /iPhone/i.test(navigator.userAgent);
      setIsMobile((smallViewport && (coarsePointer || noHover || touchCapable)) || isiPhone);
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    <main className="flex flex-col w-full h-dvh overflow-hidden">
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
