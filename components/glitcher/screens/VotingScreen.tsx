"use client";

import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import DiscussionScreen from "./DiscussionScreen";
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
  return (
    <DiscussionScreen
      gameState={gameState}
      me={me}
      emitAction={emitAction}
      onExit={onExit}
    />
  );
}
