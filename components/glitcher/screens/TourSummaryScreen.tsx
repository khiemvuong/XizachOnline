"use client";

import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import RevealScreen from "./RevealScreen";
import type { EmitGlitcherAction } from "../gameTypes";

export default function TourSummaryScreen({
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
  return (
    <RevealScreen
      gameState={gameState}
      me={me}
      emitAction={emitAction}
      onExit={onExit}
    />
  );
}
