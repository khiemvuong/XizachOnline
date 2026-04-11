import { useState, useEffect, RefObject } from 'react';

/**
 * A hook that scales an element down so that its natural height (scrollHeight)
 * fits entirely within its container's visible height (clientHeight), preventing scrolling.
 */
export function useScrollFitScale({
  containerRef,
  contentRef,
  minScale = 0.55,
  maxScale = 1,
  dependencies = [],
  active = true
}: {
  containerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  minScale?: number;
  maxScale?: number;
  dependencies?: unknown[];
  active?: boolean;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!active || !containerRef.current || !contentRef.current) return;

    const compute = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Temporarily remove transform to measure natural dimensions accurately
      const prevTransform = content.style.transform;
      const prevWidth = content.style.width;
      
      content.style.transform = '';
      content.style.width = '100%';

      const vh = container.clientHeight;
      const nh = content.scrollHeight;

      if (vh > 0 && nh > 0) {
        setScale(Math.max(minScale, Math.min(maxScale, vh / nh)));
      } else {
        setScale(1);
      }

      // Restore inline styles
      content.style.transform = prevTransform;
      content.style.width = prevWidth;
    };

    // Run compute immediately, but allow UI paints to catch up first if state drastically changed
    requestAnimationFrame(compute);

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null;
    if (observer) {
      observer.observe(containerRef.current);
      observer.observe(contentRef.current);
    }

    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, contentRef, minScale, maxScale, active, ...dependencies]);

  return scale;
}
