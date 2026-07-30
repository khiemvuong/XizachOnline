"use client";

import { useMemo, useState } from "react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";
import type { EmitGlitcherAction } from "../gameTypes";

export default function VotingScreen({
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
      timerLabel="Thời gian bỏ phiếu"
      onExit={onExit}
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
    >
      <div className="glitcher-voting-panel">
        <div className="glitcher-panel-heading">
          <span>Phiếu kín</span>
          <h1>Ai là Glitch?</h1>
        </div>

        <p>Chọn đúng một người trên bàn. Bạn không thể chọn chính mình hoặc bỏ trắng.</p>

        <div className={`glitcher-vote-selection ${selectedPlayer ? "has-selection" : ""}`}>
          <span>Lựa chọn của bạn</span>
          <strong>{selectedPlayer?.name ?? "Chưa chọn"}</strong>
        </div>

        <button
          type="button"
          onClick={submitVote}
          disabled={!selectedUserId || hasSubmitted}
          className="glitcher-primary-button"
        >
          {hasSubmitted ? "Đã khóa phiếu" : "Khóa phiếu"}
        </button>

        <div className="glitcher-vote-progress" aria-live="polite">
          <strong>{gameState.voteProgress?.submitted ?? 0}/{gameState.voteProgress?.required ?? 0}</strong>
          <span>phiếu đã gửi</span>
        </div>
      </div>
    </GameTableFrame>
  );
}
