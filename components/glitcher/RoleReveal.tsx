"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Sparkles, UsersRound, Zap, CheckCircle2 } from "lucide-react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { useSceneScale } from "@/hooks/useSceneScale";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import BrandMark from "./BrandMark";
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

  const [isRevealed, setIsRevealed] = useState(false);

  const card = gameState.privateCard;
  const confirmedCount = gameState.players.filter((player) => player.hasConfirmedRole).length;
  const connectedCount = gameState.players.filter(
    (player) => player.status === "connected" && !player.isSpectator,
  ).length;

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(11, 16, 20, 0.75)",
              border: "1px solid rgba(71, 215, 215, 0.3)",
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              color: "#8be0d0",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              boxShadow: "0 0 15px rgba(71, 215, 215, 0.15)",
            }}
          >
            <Zap style={{ width: 16, height: 16, color: "#ff746f" }} />
            Phase Xem Vai & Hiện Trường
          </div>
          <button type="button" onClick={onExit} className="glitcher-icon-button" aria-label="Rời phòng">
            <ArrowLeft aria-hidden="true" />
          </button>
        </header>

        {card ? (
          <main className="glitcher-role-layout" style={{ gap: "24px" }}>
            {/* Left Section: Scene Data / Hiện Trường */}
            <section
              className="glitcher-role-scene-data"
              aria-labelledby="glitcher-scene-title"
              onClick={() => setIsRevealed((prev) => !prev)}
              style={{
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                border: isRevealed
                  ? "1px solid rgba(71, 215, 215, 0.45)"
                  : "1px dashed rgba(255, 116, 111, 0.35)",
                boxShadow: isRevealed
                  ? "0 0 30px rgba(71, 215, 215, 0.15), inset 0 0 20px rgba(71, 215, 215, 0.05)"
                  : "inset 0 0 30px rgba(0, 0, 0, 0.5)",
                borderRadius: "24px",
                overflow: "hidden",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    color: isRevealed ? "#47d7d7" : "#ff746f",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Sparkles style={{ width: 14, height: 14 }} />
                  {isRevealed ? "DỮ LIỆU HIỆN TRƯỜNG" : "DỮ LIỆU MÀN CHƠI"}
                </span>
              </div>

              <div
                style={{
                  filter: isRevealed ? "none" : "blur(12px) opacity(0.25)",
                  transition: "filter 0.4s ease, opacity 0.4s ease",
                  transform: isRevealed ? "scale(1)" : "scale(0.98)",
                }}
              >
                <small
                  style={{
                    color: "#ff746f",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "0.4rem",
                  }}
                >
                  ■ HIỆN TRƯỜNG
                </small>
                <h1
                  id="glitcher-scene-title"
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: "#f5eee8",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    textShadow: isRevealed ? "0 0 15px rgba(255, 255, 255, 0.3)" : "none",
                    margin: "0 0 1.2rem 0",
                  }}
                >
                  {card.scene.title}
                </h1>
                <p
                  style={{
                    color: "#c9c2bc",
                    fontSize: "1.15rem",
                    lineHeight: 1.55,
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {card.scene.description}
                </p>
              </div>

              <Image
                src={GLITCHER_ASSETS.vector.divider}
                alt=""
                aria-hidden="true"
                width={640}
                height={24}
                unoptimized
                style={{
                  opacity: isRevealed ? 0.85 : 0.25,
                  transition: "opacity 0.3s ease",
                  marginTop: "auto",
                  paddingTop: "1rem",
                }}
              />
            </section>

            {/* Center Section: Main Interactive Cyber Role Card */}
            <section
              className="glitcher-role-card"
              aria-labelledby="glitcher-role-title"
              onClick={() => setIsRevealed((prev) => !prev)}
              style={{
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: "24px",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                border: isRevealed
                  ? "2px solid rgba(255, 116, 111, 0.65)"
                  : "2px solid rgba(71, 215, 215, 0.3)",
                boxShadow: isRevealed
                  ? "0 0 40px rgba(255, 116, 111, 0.35), inset 0 0 30px rgba(255, 116, 111, 0.1)"
                  : "0 0 20px rgba(0, 0, 0, 0.6)",
              }}
            >
              <Image
                src={GLITCHER_ASSETS.raster.roleFloralFrame}
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="52vw"
                className="glitcher-role-card__flowers"
                style={{
                  opacity: isRevealed ? 0.95 : 0.2,
                  filter: isRevealed ? "none" : "grayscale(80%)",
                  transition: "all 0.4s ease",
                }}
              />

              {/* Encrypted / Glitch Mode Overlay Cover */}
              {!isRevealed ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 20,
                    background:
                      "radial-gradient(circle at center, rgba(16, 23, 28, 0.92) 0%, rgba(7, 10, 13, 0.97) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                    textAlign: "center",
                    gap: "1.2rem",
                  }}
                >
                  {/* Rotating Rose Core Graphics Asset */}
                  <div style={{ position: "relative", width: 140, height: 140 }}>
                    <Image
                      src={GLITCHER_ASSETS.raster.roseDataCore}
                      alt=""
                      aria-hidden="true"
                      width={140}
                      height={140}
                      style={{
                        animation: "glitcher-spin 20s linear infinite",
                        filter: "drop-shadow(0 0 15px rgba(255, 116, 111, 0.5))",
                        opacity: 0.85,
                      }}
                    />
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontFamily: "var(--font-glitcher-display), sans-serif",
                        fontSize: "1.4rem",
                        letterSpacing: "0.18em",
                        color: "#ff746f",
                        textShadow:
                          "-2px 0 rgba(71, 215, 215, 0.7), 2px 0 rgba(255, 116, 111, 0.7)",
                        textTransform: "uppercase",
                      }}
                    >
                      [ SYSTEM GLITCHED ]
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "0.4rem",
                        color: "#8be0d0",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        letterSpacing: "0.12em",
                      }}
                    >
                      DỮ LIỆU THẺ VAI ĐANG ẨN
                    </span>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      background: "linear-gradient(90deg, rgba(255, 116, 111, 0.25), rgba(71, 215, 215, 0.25))",
                      border: "1px solid rgba(255, 116, 111, 0.5)",
                      padding: "0.65rem 1.5rem",
                      borderRadius: "999px",
                      color: "#f5eee8",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      boxShadow: "0 0 20px rgba(255, 116, 111, 0.3)",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <Eye style={{ width: 20, height: 20, color: "#8be0d0" }} />
                    <span>CHẠM ĐỂ XEM THẺ VAI</span>
                  </div>

                  <Image
                    src={GLITCHER_ASSETS.vector.divider}
                    alt=""
                    aria-hidden="true"
                    width={320}
                    height={16}
                    unoptimized
                    style={{ opacity: 0.5, marginTop: "0.5rem" }}
                  />
                </div>
              ) : null}

              {/* Decrypted / Revealed Role Details */}
              <div
                className="glitcher-role-card__content"
                style={{
                  filter: isRevealed ? "none" : "blur(18px)",
                  opacity: isRevealed ? 1 : 0.15,
                  transition: "filter 0.4s ease, opacity 0.4s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                {/* Subtitle Badge matching image 1 */}
                <div
                  style={{
                    color: "#ff746f",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#7f898d", opacity: 0.6 }}>|||</span>
                  VAI CỦA BẠN
                  <span style={{ color: "#7f898d", opacity: 0.6 }}>|||</span>
                </div>

                {/* Main Large Role Title matching image 1 */}
                <h2
                  id="glitcher-role-title"
                  style={{
                    fontSize: "4.8rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "0.04em",
                    color: "#ff746f",
                    textTransform: "uppercase",
                    textShadow:
                      "-2px 0 rgba(71, 215, 215, 0.4), 2px 0 rgba(255, 116, 111, 0.5), 0 0 35px rgba(255, 116, 111, 0.35)",
                    margin: "0.4rem 0 0.8rem 0",
                  }}
                >
                  {card.role.name}
                </h2>

                <Image
                  src={GLITCHER_ASSETS.vector.divider}
                  alt=""
                  aria-hidden="true"
                  width={380}
                  height={18}
                  unoptimized
                  style={{ opacity: 0.85, margin: "0.4rem 0 1.25rem 0" }}
                />

                {/* Role Action Paragraph matching image 1 */}
                <p
                  style={{
                    fontSize: "1.45rem",
                    color: "#f5eee8",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    margin: "0 auto",
                    maxWidth: "520px",
                    textAlign: "center",
                  }}
                >
                  {card.role.action}
                </p>

                <div
                  style={{
                    marginTop: "1.75rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.8rem",
                    color: "#7f898d",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                  }}
                >
                  <EyeOff style={{ width: 14, height: 14, color: "#ff746f" }} />
                  <span>Bấm lại vào thẻ để ẩn vai</span>
                </div>
              </div>
            </section>

            {/* Right Section: Instructions & Ready Action */}
            <aside
              className="glitcher-role-answers"
              aria-labelledby="glitcher-answer-heading"
              style={{
                borderRadius: "24px",
                border: "1px solid rgba(139, 224, 208, 0.35)",
                background: "rgba(11, 16, 20, 0.88)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <h2
                  id="glitcher-answer-heading"
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: "#8be0d0",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Zap style={{ width: 20, height: 20, color: "#ff746f" }} />
                  Hướng Dẫn
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#c9c2bc", lineHeight: 1.5, margin: 0 }}>
                  Hãy ghi nhớ vai diễn và hành động của bạn. Ở vòng kế tiếp, khi đến lượt, bạn sẽ diễn và tự bấm trả lời <strong>CÓ</strong> hoặc <strong>KHÔNG</strong> trên màn hình khi được hỏi.
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255, 116, 111, 0.08)",
                  border: "1px solid rgba(255, 116, 111, 0.25)",
                  borderRadius: "16px",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <UsersRound style={{ width: 22, height: 22, color: "#ff746f" }} />
                  <span style={{ fontSize: "0.85rem", color: "#c9c2bc" }}>Trạng thái nhóm:</span>
                </div>
                <strong style={{ fontSize: "1.25rem", color: "#8be0d0" }}>
                  {confirmedCount}/{connectedCount} <small style={{ fontSize: "0.75rem", color: "#7f898d" }}>sẵn sàng</small>
                </strong>
              </div>

              <button
                type="button"
                onClick={() => emitAction("confirmRole")}
                disabled={Boolean(me?.hasConfirmedRole)}
                className="glitcher-primary-button"
                style={{
                  width: "100%",
                  minHeight: "56px",
                  fontSize: "1.05rem",
                  marginTop: "auto",
                  backgroundColor: me?.hasConfirmedRole ? "rgba(139, 224, 208, 0.2)" : undefined,
                  borderColor: me?.hasConfirmedRole ? "rgba(139, 224, 208, 0.5)" : undefined,
                }}
              >
                {me?.hasConfirmedRole ? (
                  <>
                    <CheckCircle2 style={{ width: 20, height: 20, color: "#8be0d0" }} />
                    <span>ĐÃ SẴN SÀNG</span>
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: 20, height: 20 }} />
                    <span>Đã hiểu</span>
                  </>
                )}
              </button>
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
