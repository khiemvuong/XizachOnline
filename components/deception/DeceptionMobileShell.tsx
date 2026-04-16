"use client";

import { useEffect, useState } from "react";
import DeceptionBoard from "./board/DeceptionBoard";

export default function DeceptionMobileShell({ roomId }: { roomId: string }) {
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

  const shellClass = [
    "deception-theme",
    "deception-orientation-lock",
    isMobile && isLandscape ? "deception-mobile-landscape" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClass}>
      {isMobile && !isLandscape && (
        <div className="deception-orientation-blocker">
          <div className="deception-orientation-card">
            <div className="text-4xl">↻</div>
            <h2 className="mt-4 text-lg font-black uppercase tracking-[0.12em] text-(--on-surface)">
              Xoay ngang điện thoại
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--on-surface-variant)">
              Giao diện Deception tối ưu cho landscape để hiển thị đủ bảng chứng cứ và thanh điều khiển.
            </p>
          </div>
        </div>
      )}

      <div className={`h-full w-full ${isMobile && !isLandscape ? "invisible" : ""}`}>
        <DeceptionBoard roomId={roomId} />
      </div>
    </main>
  );
}
