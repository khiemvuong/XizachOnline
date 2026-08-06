import { getAppStorage } from "./appStorage";

const IDENTITY_KEY = "pangames.browser-identity.v1";
const LEGACY_IDENTITY_KEYS = ["xz_userId", "avalon_userId"] as const;

function createIdentityId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function getOrCreateBrowserIdentity(): string {
  const storage = getAppStorage();
  if (!storage) return "";

  const current = storage.getItem(IDENTITY_KEY);
  if (current) return current;

  const legacy = LEGACY_IDENTITY_KEYS
    .map((key) => storage.getItem(key))
    .find((value): value is string => Boolean(value));
  const identityId = legacy ?? createIdentityId();
  storage.setItem(IDENTITY_KEY, identityId);
  for (const key of LEGACY_IDENTITY_KEYS) storage.removeItem(key);
  return identityId;
}

