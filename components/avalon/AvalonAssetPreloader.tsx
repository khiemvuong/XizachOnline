"use client";

import { useEffect } from "react";

const ASSETS_TO_PRELOAD = [
  // Role Images
  "/avalon_roles/merlin.jpeg",
  "/avalon_roles/percival.jpeg",
  "/avalon_roles/assassin.jpeg",
  "/avalon_roles/morgana.jpeg",
  "/avalon_roles/mordred.jpeg",
  "/avalon_roles/oberon.jpeg",
  "/avalon_roles/athena.jpeg",
  "/avalon_roles/good_minion.jpeg",
  "/avalon_roles/evil_minion.jpeg",
  "/avalon_roles/unknown.jpeg",
  "/avalon_roles/merlin_or_morgana.jpeg",
  "/avalon_roles/cloneavatar.jpg",
  "/avalon_roles/background.png", // Main lobby/board background
  // Game Over Backgrounds
  "/game_over_bg/evil_win.png",
  "/game_over_bg/good_win.png",
  "/game_over_bg/defeat_loyal.png",
  "/game_over_bg/defeat_traitor.png",

  // Backgrounds
  "/Image/assasin_background.png",
  "/Image/atmospheric-bg.png",
  "/Image/castle-bg.png",
  // NOTE: mission_success.png & mission_failed.png are preloaded via Next.js <Image priority>
  // in RoundTable.tsx — raw new Image() doesn't warm the /_next/image optimizer cache.
];

export default function AvalonAssetPreloader() {
  useEffect(() => {
    // Silent preloading of images logic.
    // By creating Image objects, the browser will fetch them in the background
    // and cache them based on their HTTP caching headers (usually disk/memory cache).
    // When Next.js <Image /> or a standard <img> requests the same URL later,
    // it will be pulled instantly from the cache.

    const preloadedImages: HTMLImageElement[] = [];

    ASSETS_TO_PRELOAD.forEach((src) => {
      const img = new globalThis.Image();
      img.src = src;
      preloadedImages.push(img);
    });

    // Cleanup isn't strictly necessary for cache, but good practice
    return () => {
      preloadedImages.forEach((img) => {
        img.src = "";
      });
    };
  }, []);

  return null; // This component renders absolutely nothing in the DOM
}
