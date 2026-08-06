"use client";

import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";
import type { EmitGlitcherAction } from "../gameTypes";

export default function QuestionRoundScreen({
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
  const round = gameState.questionRound;
  const targetPlayer = gameState.players.find(
    (player) => player.userId === round?.targetUserId,
  );
  const currentQuestioner = gameState.players.find(
    (player) => player.userId === round?.currentQuestionerUserId,
  );
  const selectedQuestion = gameState.questions.find(
    (question) => question.id === round?.selectedQuestionId,
  );

  const isTargetTurn = Boolean(me && me.userId === round?.targetUserId);
  const isQuestionerTurn = Boolean(me && me.userId === round?.currentQuestionerUserId);
  const usedQuestions = new Set(round?.usedQuestionIds ?? []);

  return (
    <GameTableFrame
      gameState={gameState}
      table={
        <PlayerRing
          players={gameState.players}
          viewerUserId={gameState.viewerUserId}
          questionerUserIds={round?.questionerUserIds}
          currentQuestionerUserId={round?.currentQuestionerUserId}
        />
      }
      onExit={onExit}
    >
      <div className="glitcher-question-panel" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
        {/* Main Action Area */}
        <div>
          <div className="glitcher-panel-heading">
            <span>
              Người diễn {(round?.performerIndex ?? 0) + 1}/{(round?.totalPerformers ?? gameState.players.length)} — Câu hỏi {(round?.turnIndex ?? 0) + 1}/3
            </span>
            <h1>Đang diễn: <strong style={{ color: "#ec4899" }}>{targetPlayer?.name}</strong></h1>
          </div>

          {round?.stage === "ANSWERING" && selectedQuestion ? (
            <div className="glitcher-selected-question" style={{ marginTop: "1rem", background: "rgba(15, 23, 42, 0.8)", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Câu hỏi từ {currentQuestioner?.name}:</span>
              <blockquote style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0.5rem 0 1rem 0", color: "#f8fafc" }}>
                &ldquo;{selectedQuestion.text}&rdquo;
              </blockquote>

              {isTargetTurn ? (
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => emitAction("answerQuestion", { answer: true })}
                    className="glitcher-primary-button"
                    style={{ flex: 1, backgroundColor: "#10b981", borderColor: "#059669", fontSize: "1.1rem" }}
                  >
                    CÓ
                  </button>

                  <button
                    type="button"
                    onClick={() => emitAction("answerQuestion", { answer: false })}
                    className="glitcher-primary-button"
                    style={{ flex: 1, backgroundColor: "#ef4444", borderColor: "#dc2626", fontSize: "1.1rem" }}
                  >
                    KHÔNG
                  </button>
                </div>
              ) : (
                <p className="glitcher-waiting-note">
                  {targetPlayer?.name} đang xác nhận câu trả lời...
                </p>
              )}
            </div>
          ) : (
            <div className="glitcher-question-list" style={{ marginTop: "1rem" }}>
              {gameState.questions.map((question, index) => {
                const wasUsed = usedQuestions.has(question.id);
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => emitAction("selectQuestion", { questionId: question.id })}
                    disabled={!isQuestionerTurn || wasUsed}
                    className={wasUsed ? "is-used" : ""}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{question.text}</strong>
                    {wasUsed ? <small>Đã dùng</small> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Realtime Answer History Log Drawer/Sidebar */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "0.75rem",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.5rem" }}>
            Nhật ký Hỏi & Đáp
          </h3>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.25rem" }}>
            {gameState.answerLog.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "2rem" }}>
                Chưa có câu trả lời nào được lưu.
              </p>
            ) : (
              gameState.answerLog.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8rem",
                    borderLeft: log.answer ? "3px solid #10b981" : "3px solid #ef4444"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.75rem" }}>
                    <span><strong>{log.targetName}</strong></span>
                    <span style={{ fontWeight: 700, color: log.answer ? "#34d399" : "#f87171" }}>
                      {log.answer ? "CÓ" : "KHÔNG"}
                    </span>
                  </div>
                  <div style={{ color: "#e2e8f0", marginTop: "0.2rem", fontWeight: 500 }}>
                    &ldquo;{log.questionText}&rdquo;
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </GameTableFrame>
  );
}
