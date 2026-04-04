import type { AvalonPlayer } from "@/server/game/AvalonTypes";

const ROLE_IMAGE_MAP: Record<string, string> = {
  Merlin: "/avalon_roles/merlin.jpeg",
  Percival: "/avalon_roles/percival.jpeg",
  Assassin: "/avalon_roles/assassin.jpeg",
  Morgana: "/avalon_roles/morgana.jpeg",
  Mordred: "/avalon_roles/mordred.jpeg",
  Oberon: "/avalon_roles/oberon.jpeg",
  Minion_Good: "/avalon_roles/good_minion.jpeg",
  Minion_Evil: "/avalon_roles/evil_minion.jpeg",
};

const FALLBACK_IMAGE = "/avalon_roles/good_minion.jpeg";
const UNKNOWN_ROLE_IMAGE = "/avalon_roles/good_minion.jpeg";
const UNKNOWN_EVIL_IMAGE = "/avalon_roles/evil_minion.jpeg";
const MERLIN_OR_MORGANA_IMAGE = "/avalon_roles/merlin.jpeg";

export function getRoleImageSrcForViewer(target: AvalonPlayer, viewer: AvalonPlayer): string {
  if (target.userId === viewer.userId && viewer.role) {
    return ROLE_IMAGE_MAP[viewer.role] ?? FALLBACK_IMAGE;
  }

  if (viewer.role === "Percival" && target.role === "Merlin" && !target.team) {
    // Server obfuscates both Merlin and Morgana as role='Merlin' for Percival.
    return MERLIN_OR_MORGANA_IMAGE;
  }

  if (target.role && ROLE_IMAGE_MAP[target.role]) {
    return ROLE_IMAGE_MAP[target.role];
  }

  if (target.team === "Evil") {
    return UNKNOWN_EVIL_IMAGE;
  }

  return UNKNOWN_ROLE_IMAGE;
}

export function getVisibleRoleLabelForViewer(target: AvalonPlayer, viewer: AvalonPlayer): string {
  if (target.userId === viewer.userId && viewer.role) return viewer.role.replace("_", " ");

  if (viewer.role === "Percival" && target.role === "Merlin" && !target.team) {
    return "Merlin hoặc Morgana";
  }

  if (target.role) return target.role.replace("_", " ");
  if (target.team === "Evil") return "Ác quỷ";

  return "Không rõ";
}
