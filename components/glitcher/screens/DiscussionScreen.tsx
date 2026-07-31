"use client";

import { useMemo, useState } from "react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";
import type { EmitGlitcherAction } from "../gameTypes";

export default function DiscussionScreen({
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [submittedLocally, setSubmittedLocally] = useState(false);

  const hasSubmitted = Boolean(me?.hasVoted || submittedLocally);

  const disabledUserIds = useMemo(() => {
    const disabled = new Set<string>();
    if (me) disabled.add(me.userId);
    if (hasSubmitted) gameState.players.forEach((player) => disabled.add(player.userId));
    return disabled;
  }, [gameState.players, hasSubmitted, me]);

  const selectedPlayer = gameState.players.find((player) => player.userId === selectedUserId);

  const submitVote = () => {
    if (!selectedUserId || hasSubmitted) return;
    setSubmittedLocally(true);
    emitAction("submitVote", { targetUserId: selectedUserId });
  };

  return (
    <GameTableFrame
      gameState={gameState}
      table={
        <PlayerRing
          players={gameState.players}
          viewerUserId={gameState.viewerUserId}
          selection={{
            selectedUserId,
            disabledUserIds,
            onSelect: setSelectedUserId,
          }}
        />
      }
      onExit={onExit}
    >
      <div className="glitcher-discussion-panel" style={{ display: "grid" }}>
        {/* Left Side: Discussion & Vote Action */}
        <div>
          <div className="glitcher-panel-heading">
            <span>Thảo luận tự do & Bỏ phiếu</span>
            <h1>Ai là kẻ giả mạo (Glitch)?</h1>
          </div>

          <div style={{background: "rgba(15, 23, 42, 0.8)", borderRadius: "1rem", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <div className={`glitcher-vote-selection ${selectedPlayer ? "has-selection" : ""}`}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Lựa chọn của bạn:</span>
              <strong style={{ fontSize: "1.2rem", display: "block", color: selectedPlayer ? "#ec4899" : "#64748b", marginTop: "0.2rem" }}>
                {selectedPlayer?.name ?? "Chưa chọn người chơi nào"}
              </strong>
            </div>

            <button
              type="button"
              onClick={submitVote}
              disabled={!selectedUserId || hasSubmitted}
              className="glitcher-primary-button"
              style={{ width: "100%", fontSize: "1.1rem" }}
            >
              {hasSubmitted ? "Đã khóa phiếu vote" : "Khóa phiếu vote"}
            </button>
          </div>
        </div>

        {/* Right Side: Realtime Answer Log */}
        <div style={{
          background: "rgba(15, 23, 42, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "0.75rem",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          maxHeight: "450px"
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
                    <span><strong>{log.targetName}</strong> (bởi {log.questionerName}):</span>
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
