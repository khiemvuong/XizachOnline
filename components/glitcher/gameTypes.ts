export type GlitcherActionEvent =
  | "selectScene"
  | "toggleReady"
  | "startTour"
  | "confirmRole"
  | "selectQuestion"
  | "answerQuestion"
  | "submitVote"
  | "returnToLobby"
  | "explicitLeave";

export type EmitGlitcherAction = (
  event: GlitcherActionEvent,
  payload?: Record<string, unknown>,
) => void;
