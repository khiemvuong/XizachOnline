# Pangames Mobile UI Scaling Rules

Pangames uses shared viewport measurement for all four game shells and a measure-then-scale pattern only for fixed-size boards that genuinely share that requirement.

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

### Performance Notes
`useSceneScale` wraps `ResizeObserver`, cleans up its listeners when the component unmounts, and provides window resize/orientation fallbacks.

### 2. `useViewportMode`

Use this in game shells for mobile/orientation decisions. It reads `visualViewport` when available, falls back to `innerWidth`/`innerHeight`, throttles updates with `requestAnimationFrame`, and owns cleanup for resize, orientation-change, address-bar, and viewport-scroll listeners.
