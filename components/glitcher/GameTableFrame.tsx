"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { GlitcherClientState } from "@/server/game/GlitcherTypes";
import { useSceneScale } from "@/hooks/useSceneScale";
import BrandMark from "./BrandMark";
import PhaseRail from "./PhaseRail";

const GLITCHER_SCENE_WIDTH = 1440;
const GLITCHER_SCENE_HEIGHT = 810;

const PHASE_LABELS: Record<GlitcherClientState["state"], string> = {
  LOBBY: "Phòng chờ",
  ROLE_REVEAL: "Xem vai",
  PERFORMANCE_AND_QUESTIONS: "Diễn & Hỏi đáp",
  DISCUSSION: "Thảo luận & Bỏ phiếu",
  VOTING: "Thảo luận & Bỏ phiếu",
  REVEAL: "Kết quả ván đấu",
};

export default function GameTableFrame({
  gameState,
  timerLabel,
  table,
  children,
  onExit,
}: {
  gameState: GlitcherClientState;
  timerLabel?: string;
  table: ReactNode;
  children: ReactNode;
  onExit: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: GLITCHER_SCENE_WIDTH,
    sceneHeight: GLITCHER_SCENE_HEIGHT,
    padding: 12,
    minScale: 0.28,
    maxScale: 1.28,
    minViewportWidth: 320,
    minViewportHeight: 250,
  });

  return (
    <div ref={viewportRef} className="glitcher-scene-viewport">
      <div
        className="glitcher-game-scene"
        style={{
          width: GLITCHER_SCENE_WIDTH,
          height: GLITCHER_SCENE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <header className="glitcher-game-header">
          <BrandMark compact />

          <div className="glitcher-game-header__meta">
            <span>
              Màn chơi #{String(gameState.sceneNumber).padStart(2, "0")}
            </span>
            <i aria-hidden="true" />
            <strong aria-live="polite">{PHASE_LABELS[gameState.state]}</strong>
          </div>

          <div className="glitcher-game-header__actions">
            {timerLabel ? (
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{timerLabel}</span>
            ) : null}
            <button type="button" onClick={onExit} className="glitcher-icon-button" aria-label="Rời phòng">
              <ArrowLeft aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="glitcher-game-body">
          <section className="glitcher-game-table" aria-label="Bàn người chơi">
            {table}
          </section>
          <aside className="glitcher-game-panel">{children}</aside>
        </div>

        <PhaseRail state={gameState.state} />
      </div>
    </div>
  );
}
