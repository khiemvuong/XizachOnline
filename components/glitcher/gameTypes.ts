export type GlitcherActionEvent =
  | "toggleReady"
  | "startTour"
  | "confirmRole"
  | "selectQuestion"
  | "completeQuestion"
  | "submitVote"
  | "nextScene"
  | "restartTour"
  | "returnToLobby"
  | "explicitLeave";

export type EmitGlitcherAction = (
  event: GlitcherActionEvent,
  payload?: Record<string, string>,
) => void;

