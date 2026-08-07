"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useSceneScale } from "@/hooks/useSceneScale";
import BrandMark from "./BrandMark";

const RESULT_SCENE_WIDTH = 1600;
const RESULT_SCENE_HEIGHT = 860;

export default function ResultSceneFrame({
  eyebrow,
  title,
  onExit,
  children,
}: {
  eyebrow: string;
  title: string;
  onExit: () => void;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: RESULT_SCENE_WIDTH,
    sceneHeight: RESULT_SCENE_HEIGHT,
    padding: 10,
    minScale: 0.28,
    maxScale: 1.28,
    minViewportWidth: 320,
    minViewportHeight: 250,
  });

  return (
    <div ref={viewportRef} className="glitcher-scene-viewport">
      <div
        className="glitcher-result-scene"
        style={{
          width: RESULT_SCENE_WIDTH,
          height: RESULT_SCENE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="glitcher-glitch-overlay" aria-hidden="true" />
        <header className="glitcher-result-scene__header">
          <BrandMark compact />
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <button type="button" onClick={onExit} className="glitcher-icon-button" aria-label="Rời phòng">
            <ArrowLeft aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
