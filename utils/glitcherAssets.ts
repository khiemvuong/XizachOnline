const GLITCHER_ASSET_ROOT = "/glitcher";

export const GLITCHER_ASSETS = {
  raster: {
    glitchOverlay: `${GLITCHER_ASSET_ROOT}/raster/glitch-overlay.png`,
    roleFloralFrame: `${GLITCHER_ASSET_ROOT}/raster/role-floral-frame.png`,
    roseCorner: `${GLITCHER_ASSET_ROOT}/raster/rose-corner.png`,
    roseDataCore: `${GLITCHER_ASSET_ROOT}/raster/rose-data-core.png`,
    roseHero: `${GLITCHER_ASSET_ROOT}/raster/rose-hero.png`,
  },
  vector: {
    brandMark: `${GLITCHER_ASSET_ROOT}/vector/glitch-g-mark.svg`,
    divider: `${GLITCHER_ASSET_ROOT}/vector/glitch-divider.svg`,
  },
} as const;

export function getGlitcherAvatarSrc(seatIndex: number): string {
  const safeSeatIndex = Math.max(0, Math.min(11, Math.trunc(seatIndex)));
  return `${GLITCHER_ASSET_ROOT}/avatars/avatar-${String(safeSeatIndex + 1).padStart(2, "0")}.png`;
}

