"use client";

import { useEffect, useState } from "react";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import GlitcherBoard from "./board/GlitcherBoard";

export default function GlitcherMobileShell({ roomId }: { roomId: string }) {
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { supported: wakeLockSupported } = useScreenWakeLock({
    enabled: isMobile,
    mobileOnly: false,
  });

  useEffect(() => {
    const updateViewportMode = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const isiPhone = /iPhone/i.test(navigator.userAgent);

      setIsMobile((smallViewport && (coarsePointer || noHover || touchCapable)) || isiPhone);
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);

  return (
    <main
      className={`glitcher-theme glitcher-orientation-shell ${
        isMobile && isLandscape ? "glitcher-mobile-landscape" : ""
      }`}
    >
      {isMobile && !isLandscape ? (
        <div className="glitcher-orientation-blocker" role="dialog" aria-modal="true">
          <div className="glitcher-orientation-card">
            <span className="glitcher-orientation-card__glyph" aria-hidden="true">
              ↻
            </span>
            <h1>Xoay ngang điện thoại</h1>
            <p>
              The Glitcher cần không gian landscape để mọi người nhìn thấy bàn chơi, câu hỏi và đồng hồ cùng lúc.
            </p>
            <span>
              {wakeLockSupported
                ? "Màn hình sẽ được giữ sáng trong lúc chơi."
                : "Trình duyệt này chưa hỗ trợ giữ màn hình sáng."}
            </span>
          </div>
        </div>
      ) : null}

      <div className={`glitcher-orientation-content ${isMobile && !isLandscape ? "is-hidden" : ""}`}>
        <GlitcherBoard roomId={roomId} />
      </div>
    </main>
  );
}

