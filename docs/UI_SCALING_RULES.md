# Avalon Mobile UI Scaling Rules

To guarantee a pristine, scroll-free, completely immersive experience on mobile landscape environments, the Avalon project utilizes a "Measure-then-Scale" layout pattern instead of fighting with native CSS Media Queries on exact pixel breakpoints.

This ensures custom game boards, cinematic election overlays, and role inspection grids uniformly shrink to fit the viewable screen WITHOUT breaking their original aspect or forcing scrollbars, maintaining absolute positional integrity.

## 🚫 Avoid
Do **not** use the following methods for fitting complex 2D spatial layouts on mobile landscape:
- Manual `ResizeObserver` setup in individual components (violates DRY).
- Complex CSS `calc()` or repeated `@media (max-height: x) { scale: 0.8 }`.
- Hardcoded `useState` flags for manual `.style.transform` properties.
- Repeating exact viewport measurement logic across multiple game screens.

## ✅ Preferred Method: Unified React Hooks

We have centralized this logic into hooks inside `hooks/`. You should invoke these hooks in your UI overlays!

### 1. `useSceneScale`
Use this when you have a **fixed-size container/scene** (e.g. `SCENE_W = 1000, SCENE_H = 600`) that needs to proportionally scale down as one complete block to perfectly fit within the user's viewport constraints (like `RoundTable` or `GameOver`).

```tsx
import { useSceneScale } from '@/hooks/useSceneScale';
import { useRef } from 'react';

const SCENE_W = 1000;
const SCENE_H = 600;

export default function MyOverlay() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SCENE_W,
    sceneHeight: SCENE_H,
    padding: 16,
    minScale: 0.3,     // safety boundary
  });

  return (
    <div ref={viewportRef} className="fixed inset-0 overflow-hidden">
      <div 
        style={{ 
          width: SCENE_W, 
          height: SCENE_H, 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center' 
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
         {/* Fixed aspect ratio content safely goes here */}
      </div>
    </div>
  )
}
```

### 2. `useScrollFitScale`
Use this when dealing with **long flowing vertical content that you want to squish** so that it fits the screen specifically to hide scrollbars. It dynamically measures `clientHeight` vs `scrollHeight` and compresses the internal content if it overhangs. (Used by `RoleReveal.tsx` side panels).

```tsx
import { useScrollFitScale } from '@/hooks/useScrollFitScale';
import { useRef } from 'react';

export default function MyScrollFittedPanel({ isCompactMode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scale = useScrollFitScale({
    containerRef,
    contentRef,
    active: isCompactMode,
    minScale: 0.55 // Prevent text from becoming absolutely unreadable
  });

  const shouldScale = isCompactMode && scale < 0.999;

  return (
     <section ref={containerRef} className={shouldScale ? 'overflow-hidden' : 'overflow-auto'}>
        <div ref={contentRef} style={shouldScale ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` } : {}}>
           {/* Long vertical flowing content */}
        </div>
     </section>
  )
}
```

### Performance Notes
Both hooks wrap `ResizeObserver` under the hood. They're heavily optimized, safe to be called in unison across nested views, correctly handle unmounting events, and have fallback polyfill behaviors baked internally preventing browser issues.
