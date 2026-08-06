"use client";

import DeceptionBoard from "./board/DeceptionBoard";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { useViewportMode } from "@/hooks/useViewportMode";

export default function DeceptionMobileShell({ roomId }: { roomId: string }) {
  const { isLandscape, isMobile } = useViewportMode();

  const { supported: wakeLockSupported } = useScreenWakeLock({
    enabled: isMobile,
    mobileOnly: false,
  });

  const shellClass = [
    "deception-theme",
    "deception-orientation-lock",
    "relative",
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
            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-(--deception-cyan)">
              {wakeLockSupported
                ? "Khi vào landscape, game se giu man hinh sang de tranh mat ket noi."
                : "Trinh duyet nay chua ho tro wake lock man hinh."}
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
