/**
 * Deception card image URLs from GitHub raw CDN.
 * Repo: https://github.com/khiemvuong/deception-assets
 *   • deception_mean/  (1–90) — all .jpeg
 *   • deception_clue/  (1–70) — all .jpeg
 */

const BASE =
  "https://raw.githubusercontent.com/khiemvuong/deception-assets/main";

// Runtime cache: source URL -> object URL blob.
// This avoids repeated network requests when cards are remounted/switched.
const warmedBlobUrlBySource = new Map<string, string>();
const inflightWarmBySource = new Map<string, Promise<void>>();

// ─── Means: all .jpeg ───

// ─── Public helpers ───

/** Returns the GitHub raw URL for a Means card by its numeric ID (1–90). */
export function getMeansImageUrl(id: number): string {
  if (id < 1 || id > 90) return "";
  return `${BASE}/deception_mean/${id}.jpeg`;
}

/**
 * Returns the GitHub raw URL for a Clue card by its numeric ID (1–70).
 * All clue images are .jpeg.
 */
export function getClueImageUrl(id: number): string {
  if (id < 1 || id > 70) return "";
  return `${BASE}/deception_clue/${id}.jpeg`;
}

function resolveSourceUrl(sourceUrl: string): string {
  return warmedBlobUrlBySource.get(sourceUrl) || sourceUrl;
}

async function warmSourceUrl(sourceUrl: string): Promise<void> {
  if (!sourceUrl || typeof window === "undefined") return;
  if (warmedBlobUrlBySource.has(sourceUrl)) return;

  const inflight = inflightWarmBySource.get(sourceUrl);
  if (inflight) return inflight;

  const job = fetch(sourceUrl, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Image warm failed: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      if (!warmedBlobUrlBySource.has(sourceUrl)) {
        const blobUrl = URL.createObjectURL(blob);
        warmedBlobUrlBySource.set(sourceUrl, blobUrl);
      }
    })
    .catch(() => {
      // Ignore warm failures and keep original source URL as fallback.
    })
    .finally(() => {
      inflightWarmBySource.delete(sourceUrl);
    });

  inflightWarmBySource.set(sourceUrl, job);
  return job;
}

export function getResolvedMeansImageUrl(id: number): string {
  return resolveSourceUrl(getMeansImageUrl(id));
}

export function getResolvedClueImageUrl(id: number): string {
  return resolveSourceUrl(getClueImageUrl(id));
}

export function warmMeansImageUrl(id: number): Promise<void> {
  return warmSourceUrl(getMeansImageUrl(id));
}

export function warmClueImageUrl(id: number): Promise<void> {
  return warmSourceUrl(getClueImageUrl(id));
}

export function isMeansImageWarmed(id: number): boolean {
  return warmedBlobUrlBySource.has(getMeansImageUrl(id));
}

export function isClueImageWarmed(id: number): boolean {
  return warmedBlobUrlBySource.has(getClueImageUrl(id));
}
