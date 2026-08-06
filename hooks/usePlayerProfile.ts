import { useState, useCallback, useEffect } from "react";
import { getAppStorage } from "@/lib/client/appStorage";

export interface PlayerProfile {
  name: string;
  avatarUrl: string | null;
}

const STORAGE_KEY = "pangames.player-profile.v1";

function readProfile(): PlayerProfile {
  if (typeof window === "undefined") return { name: "", avatarUrl: null };
  try {
    const storage = getAppStorage();
    const raw = storage?.getItem(STORAGE_KEY) ?? storage?.getItem("xz_player_profile");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
      return {
        name: parsed.name || "",
        avatarUrl: parsed.avatarUrl ?? null,
      };
    }
  } catch {
    // Corrupted data — ignore
  }
  return { name: "", avatarUrl: null };
}

function writeProfile(profile: PlayerProfile) {
  const storage = getAppStorage();
  storage?.setItem(STORAGE_KEY, JSON.stringify(profile));
  storage?.removeItem("xz_player_profile");
}

/**
 * Shared player profile (name + avatar) persisted in environment-selected storage.
 * Works across Deception, Avalon, and any future game modes.
 */
export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile>({ name: "", avatarUrl: null });

  // Sync on mount (handles SSR → client hydration)
  useEffect(() => {
    // eslint-disable-next-line
    setProfile(readProfile());
  }, []);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => {
      const next = { ...prev, name };
      writeProfile(next);
      return next;
    });
  }, []);

  const updateAvatar = useCallback((avatarUrl: string | null) => {
    setProfile((prev) => {
      const next = { ...prev, avatarUrl };
      writeProfile(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback((partial: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      writeProfile(next);
      return next;
    });
  }, []);

  return {
    profile,
    updateName,
    updateAvatar,
    updateProfile,
  };
}
