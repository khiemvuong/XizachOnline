import { useEffect, useMemo, useState } from "react";
import type { DeceptionPlayer } from "@/server/game/DeceptionTypes";
import {
  isClueImageWarmed,
  isMeansImageWarmed,
  warmClueImageUrl,
  warmMeansImageUrl,
} from "@/utils/deceptionAssets";

type UsePreloadCardImagesOptions = {
  priorityUserId?: string;
};

type UsePreloadCardImagesResult = {
  ready: boolean;
  priorityReady: boolean;
  playerReadyMap: Record<string, boolean>;
};

function isPlayerCardsReady(player: DeceptionPlayer): boolean {
  const meansReady = (player.meansCards ?? []).every((card) =>
    isMeansImageWarmed(card.id),
  );
  const cluesReady = (player.clueCards ?? []).every((card) =>
    isClueImageWarmed(card.id),
  );
  return meansReady && cluesReady;
}

function playersWarmSignature(players: DeceptionPlayer[]): string {
  return players
    .map((player) => {
      const means = (player.meansCards ?? []).map((card) => card.id).join(",");
      const clues = (player.clueCards ?? []).map((card) => card.id).join(",");
      return `${player.userId}:${means}|${clues}`;
    })
    .join(";");
}

/**
 * Preloads all card images for the given players using the browser's native
 * image cache. Once loaded, subsequent renders using the same URL (via CSS
 * background-image or <img>) will hit the cache instantly.
 *
 * Call this once in the root game component (e.g. DiscussionBoard) so every
 * modal that opens later gets instant display.
 */
export function usePreloadCardImages(
  players: DeceptionPlayer[],
  options?: UsePreloadCardImagesOptions,
): UsePreloadCardImagesResult {
  const priorityUserId = options?.priorityUserId;
  const [, setWarmVersion] = useState(0);
  const signature = useMemo(() => playersWarmSignature(players), [players]);

  const playerReadyMap: Record<string, boolean> = {};
  players.forEach((player) => {
    playerReadyMap[player.userId] = isPlayerCardsReady(player);
  });

  const ready = players.every((player) => playerReadyMap[player.userId]);
  const priorityReady = priorityUserId
    ? Boolean(playerReadyMap[priorityUserId])
    : ready;

  useEffect(() => {
    if (typeof window === "undefined" || players.length === 0) return;

    let cancelled = false;
    let queueTick: ReturnType<typeof setTimeout> | null = null;

    const warmPlayer = async (player: DeceptionPlayer) => {
      const warmJobs: Promise<void>[] = [];

      for (const card of player.meansCards ?? []) {
        if (!isMeansImageWarmed(card.id)) {
          warmJobs.push(warmMeansImageUrl(card.id));
        }
      }

      for (const card of player.clueCards ?? []) {
        if (!isClueImageWarmed(card.id)) {
          warmJobs.push(warmClueImageUrl(card.id));
        }
      }

      if (warmJobs.length === 0) return;

      await Promise.allSettled(warmJobs);
      if (!cancelled) {
        setWarmVersion((prev) => prev + 1);
      }
    };

    const prioritizedPlayers = [...players].sort((left, right) => {
      if (!priorityUserId) return 0;
      if (left.userId === priorityUserId) return -1;
      if (right.userId === priorityUserId) return 1;
      return 0;
    });

    const run = async () => {
      if (
        priorityUserId &&
        prioritizedPlayers[0] &&
        prioritizedPlayers[0].userId === priorityUserId
      ) {
        await warmPlayer(prioritizedPlayers[0]);
      }

      for (const player of prioritizedPlayers) {
        if (cancelled || player.userId === priorityUserId) continue;

        await new Promise<void>((resolve) => {
          queueTick = setTimeout(resolve, 42);
        });

        if (cancelled) return;
        await warmPlayer(player);
      }
    };

    run().catch(() => {
      // Ignore preload failures and keep fallback image URLs.
    });

    return () => {
      cancelled = true;
      if (queueTick) clearTimeout(queueTick);
    };
  }, [players, priorityUserId, signature]);

  return {
    ready,
    priorityReady,
    playerReadyMap,
  };
}
