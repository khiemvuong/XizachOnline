"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, LockKeyhole, UsersRound } from "lucide-react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { useSceneScale } from "@/hooks/useSceneScale";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import BrandMark from "./BrandMark";
import GlitcherTimer from "./GlitcherTimer";
import type { EmitGlitcherAction } from "./gameTypes";

const ROLE_SCENE_WIDTH = 1440;
const ROLE_SCENE_HEIGHT = 810;

export default function RoleReveal({
  gameState,
  me,
  emitAction,
  onExit,
}: {
  gameState: GlitcherClientState;
  me?: GlitcherPublicPlayer;
  emitAction: EmitGlitcherAction;
  onExit: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: ROLE_SCENE_WIDTH,
    sceneHeight: ROLE_SCENE_HEIGHT,
    padding: 12,
    minScale: 0.28,
    maxScale: 1.28,
    minViewportWidth: 320,
    minViewportHeight: 250,
  });

  const card = gameState.privateCard;
  const confirmedCount = gameState.players.filter((player) => player.hasConfirmedRole).length;
  const connectedCount = gameState.players.filter((player) => player.status === "connected").length;

  return (
    <div ref={viewportRef} className="glitcher-scene-viewport">
      <div
        className="glitcher-role-scene"
        style={{
          width: ROLE_SCENE_WIDTH,
          height: ROLE_SCENE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="glitcher-glitch-overlay" aria-hidden="true" />

        <header className="glitcher-role-scene__header">
          <BrandMark compact />
          <GlitcherTimer
            startedAt={gameState.phaseStartedAt}
            deadlineAt={gameState.phaseDeadlineAt}
            label="Thời gian đọc vai"
          />
          <button type="button" onClick={onExit} className="glitcher-icon-button" aria-label="Rời phòng">
            <ArrowLeft aria-hidden="true" />
          </button>
        </header>

        {card ? (
          <main className="glitcher-role-layout">
            <section className="glitcher-role-scene-data" aria-labelledby="glitcher-scene-title">
              <span>Dữ liệu vòng {String(gameState.sceneNumber).padStart(2, "0")}</span>
              <div>
                <small>Hiện trường</small>
                <h1 id="glitcher-scene-title">{card.scene.title}</h1>
                <p>{card.scene.description}</p>
              </div>
              <Image
                src={GLITCHER_ASSETS.vector.divider}
                alt=""
                aria-hidden="true"
                width={640}
                height={24}
                unoptimized
              />
            </section>

            <section className="glitcher-role-card" aria-labelledby="glitcher-role-title">
              <Image
                src={GLITCHER_ASSETS.raster.roleFloralFrame}
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="52vw"
                className="glitcher-role-card__flowers"
              />
              <div className="glitcher-role-card__content">
                <span>Vai của bạn</span>
                <h2 id="glitcher-role-title">{card.role.name}</h2>
                <i aria-hidden="true" />
                <p>{card.role.action}</p>
              </div>
            </section>

            <aside className="glitcher-role-answers" aria-labelledby="glitcher-answer-heading">
              <h2 id="glitcher-answer-heading">Đáp án của bạn</h2>
              <ol>
                {gameState.questions.map((question, index) => {
                  const answer = card.answers[index];
                  return (
                    <li key={question.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{answer ? "Có" : "Không"}</strong>
                    </li>
                  );
                })}
              </ol>

              <div className="glitcher-role-ready-count">
                <UsersRound aria-hidden="true" />
                <strong>{confirmedCount}/{connectedCount}</strong>
                <span>đã sẵn sàng</span>
              </div>

              <button
                type="button"
                onClick={() => emitAction("confirmRole")}
                disabled={Boolean(me?.hasConfirmedRole)}
                className="glitcher-primary-button"
              >
                {me?.hasConfirmedRole ? "Đã xác nhận" : "Tôi đã hiểu"}
              </button>

              <p className="glitcher-role-privacy">
                <LockKeyhole aria-hidden="true" />
                <span>Đừng để người khác nhìn thấy</span>
              </p>
            </aside>
          </main>
        ) : (
          <div className="glitcher-role-loading" role="status">
            Đang giải mã dữ liệu riêng…
          </div>
        )}
      </div>
    </div>
  );
}

