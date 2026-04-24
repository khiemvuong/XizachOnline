/**
 * Deception card image URLs.
 * Switched from GitHub to ImageKit for better performance/management.
 */

// TODO: Replace with your actual ImageKit ID (e.g. "ik_user_123")
const IMAGEKIT_ID = "khiemvuong"; 
const BASE = `https://ik.imagekit.io/${IMAGEKIT_ID}/deception_card/deception_asset`;

// Runtime cache: set of source URLs that have been "warmed" (loaded into browser cache).
const warmedSources = new Set<string>();
const inflightWarmBySource = new Map<string, Promise<void>>();

// ─── Public helpers ───

// Default transformation for cards: width 400px, quality 70%
const CARD_TR = "tr=w-400,q-70";
// For roles/backgrounds: width 800px, quality 80%
const LARGE_TR = "tr=w-800,q-80";

/** Returns the URL for a Means card by its numeric ID (1–90). */
export function getMeansImageUrl(id: number): string {
  if (id < 1 || id > 90) return "";
  return `${BASE}/deception_mean/${id}.jpeg?${CARD_TR}`;
}

/**
 * Returns the URL for a Clue card by its numeric ID (1–70).
 * All clue images are .jpeg.
 */
export function getClueImageUrl(id: number): string {
  if (id < 1 || id > 200) return "";
  return `${BASE}/deception_clue/${id}.jpeg?${CARD_TR}`;
}

/**
 * Returns the URL for a Role card (forensic, murderer, accomplice, witness, investigator).
 */
export function getRoleImageUrl(roleKey: string): string {
  return `${BASE}/deception_roles/${roleKey.toLowerCase()}.jpeg?${CARD_TR}`;
}

/**
 * Returns the URL for background images (avalon, deception).
 */
export function getBackgroundUrl(name: string): string {
  return `${BASE}/background/${name}.jpeg?${LARGE_TR}`;
}

async function warmSourceUrl(sourceUrl: string, retryCount = 0): Promise<void> {
  if (!sourceUrl || typeof window === "undefined") return;
  if (warmedSources.has(sourceUrl)) return;

  const inflight = inflightWarmBySource.get(sourceUrl);
  if (inflight) return inflight;

  const job = (async () => {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          warmedSources.add(sourceUrl);
          resolve();
        };
        img.onerror = () => reject(new Error("Load failed"));
        img.src = sourceUrl;
      });
    } catch {
      if (retryCount < 2) {
        // Retry after a delay
        await new Promise(r => setTimeout(r, 800 * (retryCount + 1)));
        return warmSourceUrl(sourceUrl, retryCount + 1);
      } else {
        // If it still fails after all retries, we still mark as warmed
        // to let the UI proceed (otherwise the Skeleton/Progress bar will hang).
        warmedSources.add(sourceUrl);
        console.warn(`[Assets] Failed to warm image after retries: ${sourceUrl}`);
      }

    }
  })().finally(() => {
    inflightWarmBySource.delete(sourceUrl);
  });

  inflightWarmBySource.set(sourceUrl, job);
  return job;
}


export function getResolvedMeansImageUrl(id: number): string {
  return getMeansImageUrl(id);
}

export function getResolvedClueImageUrl(id: number): string {
  return getClueImageUrl(id);
}

export function warmMeansImageUrl(id: number): Promise<void> {
  return warmSourceUrl(getMeansImageUrl(id));
}

export function warmClueImageUrl(id: number): Promise<void> {
  return warmSourceUrl(getClueImageUrl(id));
}

export function isMeansImageWarmed(id: number): boolean {
  return warmedSources.has(getMeansImageUrl(id));
}

export function isClueImageWarmed(id: number): boolean {
  return warmedSources.has(getClueImageUrl(id));
}
