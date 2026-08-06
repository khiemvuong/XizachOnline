export function getAppStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return process.env.NODE_ENV === "production"
    ? window.localStorage
    : window.sessionStorage;
}

