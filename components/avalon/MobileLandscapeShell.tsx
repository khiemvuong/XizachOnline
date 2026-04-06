"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvalonBoard from "./AvalonBoard";

export default function MobileLandscapeShell({ roomId }: { roomId: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [canUseFullscreen, setCanUseFullscreen] = useState(false);

  type FullscreenCapableElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
  };

  type FullscreenCapableDocument = Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
  };

  const isDocumentFullscreen = useCallback(() => {
    const doc = document as FullscreenCapableDocument;
    return Boolean(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      // iOS standalone PWA mode = effectively fullscreen
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  }, []);

  const supportsFullscreen = useCallback(() => {
    // iOS PWA standalone = already "fullscreen"
    if ((window.navigator as { standalone?: boolean }).standalone === true) return true;
    const el = document.documentElement as FullscreenCapableElement;
    return (
      typeof el.requestFullscreen === "function" ||
      typeof el.webkitRequestFullscreen === "function" ||
      typeof el.mozRequestFullScreen === "function"
    );
  }, []);

  useEffect(() => {
    const updateViewportFlags = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const isiPhone = /iPhone/i.test(navigator.userAgent);
      const landscape = window.matchMedia("(orientation: landscape)").matches;

      setIsMobile((smallViewport && (coarsePointer || noHover || touchCapable)) || isiPhone);
      setIsLandscape(landscape);
      setIsFullscreen(isDocumentFullscreen());
      setCanUseFullscreen(supportsFullscreen());
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
  }, [isDocumentFullscreen, supportsFullscreen]);

  const enterImmersive = () => {
    // If already in iOS PWA standalone mode, skip (already fullscreen)
    if ((window.navigator as { standalone?: boolean }).standalone === true) return;

    const target = (rootRef.current ?? document.documentElement) as FullscreenCapableElement;
    
    // MUST be called synchronously in the user gesture handler
    // Using .then()/.catch() instead of async/await to preserve gesture chain
    let fsPromise: Promise<void> | void | undefined;
    if (!isDocumentFullscreen()) {
      if (typeof target.requestFullscreen === "function") {
        fsPromise = target.requestFullscreen();
      } else if (typeof target.webkitRequestFullscreen === "function") {
        fsPromise = target.webkitRequestFullscreen();
      } else if (typeof (target as FullscreenCapableElement).mozRequestFullScreen === "function") {
        fsPromise = (target as FullscreenCapableElement).mozRequestFullScreen?.();
      }
    }

    const lockOrientation = () => {
      const orientationApi = window.screen?.orientation as
        | (ScreenOrientation & {
            lock?: (
              orientation:
                | "any" | "natural" | "landscape" | "portrait"
                | "portrait-primary" | "portrait-secondary"
                | "landscape-primary" | "landscape-secondary"
            ) => Promise<void>;
          })
        | undefined;
      if (orientationApi?.lock) {
        orientationApi.lock("landscape").catch(() => {});
      }
    };

    if (fsPromise && typeof fsPromise.then === "function") {
      fsPromise.then(lockOrientation).catch(() => {
        // Mobile browser blocked fullscreen — that's expected on iOS Safari
      });
    } else {
      lockOrientation();
    }
  };

  const exitImmersive = async () => {
    try {
      const fullscreenDocument = document as FullscreenCapableDocument;
      if (isDocumentFullscreen()) {
        if (typeof document.exitFullscreen === "function") {
          await document.exitFullscreen();
        } else if (typeof fullscreenDocument.webkitExitFullscreen === "function") {
          await fullscreenDocument.webkitExitFullscreen();
        }
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

        {isMobile ? (
          !isFullscreen ? (
            <button type="button" className="avalon-immersive-btn" onClick={enterImmersive}>
              {canUseFullscreen ? "Toàn màn hình" : "Thử toàn màn hình"}
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
            <button type="button" className="avalon-orientation-action" onClick={enterImmersive}>
              {canUseFullscreen ? "Bật toàn màn hình" : "Thử toàn màn hình"}
            </button>
          </div>
        </div>

        <div className={`avalon-orientation-game ${isMobile && isLandscape ? "avalon-mobile-landscape" : ""}`}>
          <AvalonBoard roomId={roomId} />
        </div>
      </div>
    </main>
  );
}
