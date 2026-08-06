"use client";

import { useEffect, useState } from "react";

export interface ViewportMode {
  width: number;
  height: number;
  isLandscape: boolean;
  isMobile: boolean;
}

const INITIAL_VIEWPORT: ViewportMode = {
  width: 0,
  height: 0,
  isLandscape: true,
  isMobile: false,
};

function readViewportMode(): ViewportMode {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width ?? window.innerWidth);
  const height = Math.round(viewport?.height ?? window.innerHeight);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const smallViewport = Math.min(width, height) <= 900;
  const isiPhone = /iPhone/i.test(navigator.userAgent);

  return {
    width,
    height,
    isLandscape: width >= height,
    isMobile: (smallViewport && (coarsePointer || noHover || touchCapable)) || isiPhone,
  };
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(INITIAL_VIEWPORT);

  useEffect(() => {
    let frameId: number | null = null;
    const update = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setMode(readViewportMode());
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return mode;
}
