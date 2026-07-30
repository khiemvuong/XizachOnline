"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { GlitcherClientState } from "@/server/game/GlitcherTypes";
import { useSceneScale } from "@/hooks/useSceneScale";
import BrandMark from "./BrandMark";
import GlitcherTimer from "./GlitcherTimer";
import PhaseRail from "./PhaseRail";

const GLITCHER_SCENE_WIDTH = 1440;
const GLITCHER_SCENE_HEIGHT = 810;

const PHASE_LABELS: Record<GlitcherClientState["state"], string> = {
  LOBBY: "Phòng chờ",
  ROLE_REVEAL: "Dữ liệu vai",
  QUESTION_ROUND: "Câu hỏi",
  PERFORMANCE_SETUP: "Chuẩn bị vị trí",
  PERFORMANCE: "Diễn không lời",
  DISCUSSION: "Thảo luận",
  VOTING: "Khóa phiếu",
  REVEAL: "Giải mã dữ liệu",
  TOUR_SUMMARY: "Tổng kết tour",
};

export default function GameTableFrame({
  gameState,
  timerLabel,
  table,
  children,
  onExit,
}: {
  gameState: GlitcherClientState;
  timerLabel: string;
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
              Scene {String(gameState.sceneNumber).padStart(2, "0")}/
              {String(gameState.totalScenes).padStart(2, "0")}
            </span>
            <i aria-hidden="true" />
            <strong aria-live="polite">{PHASE_LABELS[gameState.state]}</strong>
          </div>

          <div className="glitcher-game-header__actions">
            <GlitcherTimer
              startedAt={gameState.phaseStartedAt}
              deadlineAt={gameState.phaseDeadlineAt}
              label={timerLabel}
            />
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

