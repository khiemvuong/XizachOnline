import { type ReactNode } from "react";

export interface GameOverTheme {
  bg: string;
  bgMix: string;
  overlayTint: string;
  
  // Victory Specific
  eyebrow?: string;
  victoryWord?: string;
  goldShimmer?: boolean;
  quote?: string;
  victoryWordColor?: string;

  // Defeat Specific
  centerIcon?: ReactNode;
  iconBg?: string;
  sub?: string;
  subColor?: string;
  dominantLabel?: string;
  dominantDesc?: string;
  dominantAccent?: string;
  dominantBorder?: string;

  // Shared
  title: string;
  accentColor: string;
  winIcon: ReactNode;
  loseIcon: ReactNode;
  winAccent: string;
  loseAccent: string;
  winPanelBorder: string;
  losePanelBorder: string;
}
