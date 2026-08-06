import { useState, useEffect, RefObject } from 'react';

export interface UseSceneScaleOptions {
  viewportRef: RefObject<HTMLElement | null>;
  sceneWidth: number;
  sceneHeight: number;
  /** Inner padding effectively taken out of the viewport size */
  padding?: number;
  /** Minimum scale possible (e.g. 0.3) */
  minScale?: number;
  /** Maximum scale possible (e.g. 1) */
  maxScale?: number;
  /** Minimum simulated viewport width to prevent scale getting infinitesimally small */
  minViewportWidth?: number;
  /** Minimum simulated viewport height to prevent scale getting infinitesimally small */
  minViewportHeight?: number;
  /** If the hook should be active. Can be toggled off to avoid unneeded measurements */
  active?: boolean;
}

/**
 * DRY Hook for the Avalon Project to scale scenes properly and responsively
 * within a landscape bounding box container via ResizeObserver.
 */
export function useSceneScale({
  viewportRef,
  sceneWidth,
  sceneHeight,
  padding = 16,
  minScale = 0.2, // Safety bound to prevent zero/negative zooms
  maxScale = 1,
  minViewportWidth = 280,
  minViewportHeight = 200,
  active = true
}: UseSceneScaleOptions) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!active) return;

    const compute = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      
      const availableWidth = Math.max(minViewportWidth, rect.width - padding);
      const availableHeight = Math.max(minViewportHeight, rect.height - padding);
      
      // Calculate how much we need to scale the fixed-size scene to fit the available space
      const widthScale = availableWidth / sceneWidth;
      const heightScale = availableHeight / sceneHeight;
      
      // Select the most restrictive scale to ensure the entire scene fits without clipping
      setScale(Math.max(minScale, Math.min(maxScale, widthScale, heightScale)));
    };

    compute();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(compute) : null;
    if (observer && viewportRef.current) {
      observer.observe(viewportRef.current);
    }
    
    // Fallback for older browsers
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    window.visualViewport?.addEventListener("resize", compute);
    window.visualViewport?.addEventListener("scroll", compute);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
      window.visualViewport?.removeEventListener("resize", compute);
      window.visualViewport?.removeEventListener("scroll", compute);
    };
  }, [
    viewportRef, 
    sceneWidth, 
    sceneHeight, 
    padding, 
    minScale, 
    maxScale, 
    minViewportWidth, 
    minViewportHeight, 
    active
  ]);

  return scale;
}
