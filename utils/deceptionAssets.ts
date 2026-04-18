/**
 * Deception card image URLs from GitHub raw CDN.
 * Repo: https://github.com/khiemvuong/deception-assets
 *   • deception_mean/  (1–90) — mixed .jpeg/.png
 *   • deception_clue/  (1–70) — all .jpeg
 */

const BASE =
  "https://raw.githubusercontent.com/khiemvuong/deception-assets/main";

// Runtime cache: source URL -> object URL blob.
// This avoids repeated network requests when cards are remounted/switched.
const warmedBlobUrlBySource = new Map<string, string>();
const inflightWarmBySource = new Map<string, Promise<void>>();

// ─── Means: mixed jpeg/png (verified from repo listing) ───

const MEANS_EXT: Record<number, "jpeg" | "png"> = {
  1:  "jpeg", 2:  "jpeg", 3:  "jpeg", 4:  "jpeg", 5:  "jpeg",
  6:  "jpeg", 7:  "jpeg", 8:  "jpeg", 9:  "png",  10: "jpeg",
  11: "jpeg", 12: "png",  13: "jpeg", 14: "jpeg", 15: "jpeg",
  16: "jpeg", 17: "jpeg", 18: "jpeg", 19: "jpeg", 20: "jpeg",
  21: "jpeg", 22: "jpeg", 23: "jpeg", 24: "jpeg", 25: "jpeg",
  26: "png",  27: "jpeg", 28: "jpeg", 29: "png",  30: "png",
  31: "jpeg", 32: "jpeg", 33: "png",  34: "jpeg", 35: "jpeg",
  36: "jpeg", 37: "png",  38: "jpeg", 39: "jpeg", 40: "jpeg",
  41: "jpeg", 42: "jpeg", 43: "jpeg", 44: "jpeg", 45: "jpeg",
  46: "jpeg", 47: "jpeg", 48: "jpeg", 49: "jpeg", 50: "jpeg",
  51: "png",  52: "jpeg", 53: "jpeg", 54: "png",  55: "jpeg",
  56: "jpeg", 57: "jpeg", 58: "jpeg", 59: "jpeg", 60: "png",
  61: "png",  62: "png",  63: "png",  64: "png",  65: "png",
  66: "png",  67: "jpeg", 68: "png",  69: "png",  70: "jpeg",
  71: "png",  72: "png",  73: "jpeg", 74: "png",  75: "png",
  76: "png",  77: "png",  78: "png",  79: "jpeg", 80: "jpeg",
  81: "jpeg", 82: "jpeg", 83: "jpeg", 84: "jpeg", 85: "png",
  86: "png",  87: "jpeg", 88: "jpeg", 89: "png",  90: "png",
};

// ─── Public helpers ───

/** Returns the GitHub raw URL for a Means card by its numeric ID (1–90). */
export function getMeansImageUrl(id: number): string {
  const ext = MEANS_EXT[id];
  if (!ext) return "";
  return `${BASE}/deception_mean/${id}.${ext}`;
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
