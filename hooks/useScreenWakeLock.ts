"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (
    type: "release",
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
};

type WakeLockApiLike = {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
};

type UseScreenWakeLockOptions = {
  enabled?: boolean;
  mobileOnly?: boolean;
  retryOnUserInteraction?: boolean;
};

function detectLikelyMobileDevice() {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const narrowViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
  return (coarsePointer || noHover || touchCapable) && narrowViewport;
}

export default function useScreenWakeLock(options: UseScreenWakeLockOptions = {}) {
  const { enabled = true, mobileOnly = true, retryOnUserInteraction = true } = options;
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  const shouldAttempt = useMemo(() => {
    if (!enabled) return false;
    if (!mobileOnly) return true;
    return detectLikelyMobileDevice();
  }, [enabled, mobileOnly]);

  const releaseWakeLock = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    if (!sentinel) {
      setActive(false);
      return;
    }
    try {
      await sentinel.release();
    } catch {
      // Ignore release errors; lock may already be released by browser.
    }
    setActive(false);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!shouldAttempt || typeof window === "undefined") return;
    if (document.visibilityState !== "visible") return;

    const wakeLockApi = (navigator as Navigator & { wakeLock?: WakeLockApiLike }).wakeLock;
    if (!wakeLockApi) {
      setSupported(false);
      setActive(false);
      return;
    }

    setSupported(true);

    if (sentinelRef.current && !sentinelRef.current.released) {
      setActive(true);
      return;
    }

    try {
      const sentinel = await wakeLockApi.request("screen");
      sentinelRef.current = sentinel;
      setActive(!sentinel.released);
      sentinel.addEventListener(
        "release",
        () => {
          sentinelRef.current = null;
          setActive(false);
        },
        { once: true },
      );
    } catch {
      setActive(false);
    }
  }, [shouldAttempt]);

  useEffect(() => {
    if (!shouldAttempt) return;

    const bootstrapTimer = window.setTimeout(() => {
      void requestWakeLock();
    }, 0);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      } else {
        void releaseWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(bootstrapTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      void releaseWakeLock();
    };
  }, [releaseWakeLock, requestWakeLock, shouldAttempt]);

  useEffect(() => {
    if (!shouldAttempt || !retryOnUserInteraction || typeof window === "undefined") return;

    const retry = () => {
      if (!active) {
        void requestWakeLock();
      }
    };

    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("touchstart", retry, { passive: true });
    window.addEventListener("keydown", retry);

    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("keydown", retry);
    };
  }, [active, requestWakeLock, retryOnUserInteraction, shouldAttempt]);

  return {
    active,
    supported,
    requestWakeLock,
    releaseWakeLock,
  };
}
