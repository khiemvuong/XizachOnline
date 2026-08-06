"use client";

import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { useViewportMode } from "@/hooks/useViewportMode";
import GlitcherBoard from "./board/GlitcherBoard";

export default function GlitcherMobileShell({ roomId }: { roomId: string }) {
  const { isLandscape, isMobile } = useViewportMode();

  const { supported: wakeLockSupported } = useScreenWakeLock({
    enabled: isMobile,
    mobileOnly: false,
  });

  return (
    <main className="glitcher-theme glitcher-orientation-shell">
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
