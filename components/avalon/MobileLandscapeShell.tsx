"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvalonBoard from "./AvalonBoard";

export default function MobileLandscapeShell({ roomId }: { roomId: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);

  useEffect(() => {
    const updateViewportFlags = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const narrowViewport = window.matchMedia("(max-width: 1100px)").matches;
      const landscape = window.matchMedia("(orientation: landscape)").matches;

      setIsMobile(coarsePointer && narrowViewport);
      setIsLandscape(landscape);
      setIsFullscreen(Boolean(document.fullscreenElement));
      setCanUseFullscreen(Boolean(document.documentElement?.requestFullscreen));
    };

    updateViewportFlags();
    window.addEventListener("resize", updateViewportFlags);
    window.addEventListener("orientationchange", updateViewportFlags);
    document.addEventListener("fullscreenchange", updateViewportFlags);

    return () => {
      window.removeEventListener("resize", updateViewportFlags);
      window.removeEventListener("orientationchange", updateViewportFlags);
      document.removeEventListener("fullscreenchange", updateViewportFlags);
    };
  }, []);

  const enterImmersive = async () => {
    try {
      const target = rootRef.current ?? document.documentElement;
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      }

      const orientationApi = window.screen?.orientation as
        | (ScreenOrientation & {
            lock?: (
              orientation:
                | "any"
                | "natural"
                | "landscape"
                | "portrait"
                | "portrait-primary"
                | "portrait-secondary"
                | "landscape-primary"
                | "landscape-secondary"
            ) => Promise<void>;
          })
        | undefined;
      if (orientationApi?.lock) {
        await orientationApi.lock("landscape");
      }
    } catch {
      // Ignore unsupported fullscreen/orientation lock APIs on iOS browsers.
    }
  };

  const exitImmersive = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore browser-specific errors when exiting fullscreen.
    }
  };

  const goBackToRoomEntry = async () => {
    await exitImmersive();
    router.push("/avalon");
  };

  const openRulesGuide = () => {
    window.dispatchEvent(new Event("avalon-open-rules"));
  };

  const shellTopOffset = "2.75rem";

  return (
    <main
      ref={rootRef}
      className="avalon-orientation-lock flex flex-col"
      style={{ ["--avalon-shell-top-offset" as string]: shellTopOffset }}
    >
      <div className="relative z-50 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/72 px-2 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button type="button" className="avalon-immersive-btn" onClick={goBackToRoomEntry}>
            Nhập mã khác
          </button>
          <button type="button" className="avalon-immersive-btn" onClick={openRulesGuide}>
            Hướng dẫn
          </button>
        </div>

        {isMobile && canUseFullscreen ? (
          !isFullscreen ? (
            <button type="button" className="avalon-immersive-btn" onClick={enterImmersive}>
              Toàn màn hình
            </button>
          ) : (
            <button type="button" className="avalon-immersive-btn" onClick={exitImmersive}>
              Thoát toàn màn hình
            </button>
          )
        ) : (
          <div className="h-9 w-8" aria-hidden="true" />
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        <div className="avalon-orientation-blocker">
          <div className="avalon-orientation-card">
            <h2 className="avalon-orientation-title">Vui lòng xoay ngang điện thoại</h2>
            <p className="avalon-orientation-note">
              Chế độ mobile này được thiết kế riêng cho màn hình ngang để tránh vướng víu và duplicate scroll.
            </p>
            {canUseFullscreen && (
              <button type="button" className="avalon-orientation-action" onClick={enterImmersive}>
                Bật toàn màn hình
              </button>
            )}
          </div>
        </div>

        <div className={`avalon-orientation-game ${isMobile && isLandscape ? "avalon-mobile-landscape" : ""}`}>
          <AvalonBoard roomId={roomId} />
        </div>
      </div>
    </main>
  );
}
