import rawGlitcherData from "./GlitcherData.json";
import type {
  GlitcherGameData,
  GlitcherGlitchRole,
  GlitcherRole,
  GlitcherScene,
  GlitcherSettings,
} from "./GlitcherTypes";

export const GLITCHER_SETTINGS: GlitcherSettings = {
  minPlayers: 6,
  maxPlayers: 13,
  scenesPerTour: 4,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${context}.${key} must be a non-empty string`);
  }
  return value;
}

function validateAnswers(
  value: unknown,
  questionIds: string[],
  context: string,
): asserts value is Record<string, boolean> | undefined {
  if (value === undefined || value === null) return;
  if (!isRecord(value)) {
    throw new Error(`${context}.answers must be an object`);
  }

  for (const key of Object.keys(value)) {
    if (typeof value[key] !== "boolean") {
      throw new Error(`${context}.answers.${key} must be boolean`);
    }
  }
}

function validateRole(
  value: unknown,
  questionIds: string[],
  context: string,
  isGlitchRole: boolean,
): asserts value is GlitcherRole | GlitcherGlitchRole {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object`);
  }

  requireString(value, "id", context);
  requireString(value, "name", context);
  requireString(value, "action", context);
  validateAnswers(value.answers, questionIds, context);

  if (isGlitchRole) {
    requireString(value, "shadow_role_id", context);
  } else if ("shadow_role_id" in value) {
    throw new Error(`${context} must not define shadow_role_id`);
  }
}

export function validateGlitcherData(
  value: unknown,
): asserts value is GlitcherGameData {
  if (!isRecord(value)) {
    throw new Error("Glitcher data root must be an object");
  }
  if (!isRecord(value.game)) {
    throw new Error("Glitcher data game metadata must be an object");
  }

  requireString(value.game, "id", "game");
  requireString(value.game, "title", "game");
  requireString(value.game, "version", "game");
  requireString(value.game, "language", "game");

  if (!Array.isArray(value.scenes) || value.scenes.length !== 16) {
    throw new Error("Glitcher data must contain exactly 16 scenes");
  }

  const allIds = new Set<string>();
  const slugs = new Set<string>();
  const addUniqueId = (id: string, context: string) => {
    if (allIds.has(id)) throw new Error(`${context} id ${id} is duplicated`);
    allIds.add(id);
  };

  value.scenes.forEach((sceneValue, sceneIndex) => {
    const context = `scenes[${sceneIndex}]`;
    if (!isRecord(sceneValue)) throw new Error(`${context} must be an object`);

    const sceneId = requireString(sceneValue, "id", context);
    const slug = requireString(sceneValue, "slug", context);
    requireString(sceneValue, "title", context);
    requireString(sceneValue, "description", context);
    addUniqueId(sceneId, context);
    if (slugs.has(slug)) throw new Error(`${context} slug ${slug} is duplicated`);
    slugs.add(slug);

    if (!Array.isArray(sceneValue.questions) || sceneValue.questions.length !== 5) {
      throw new Error(`${context}.questions must contain exactly 5 questions`);
    }
    const questionIds = sceneValue.questions.map((questionValue, questionIndex) => {
      const questionContext = `${context}.questions[${questionIndex}]`;
      if (!isRecord(questionValue)) {
        throw new Error(`${questionContext} must be an object`);
      }
      const questionId = requireString(questionValue, "id", questionContext);
      requireString(questionValue, "text", questionContext);
      addUniqueId(questionId, questionContext);
      return questionId;
    });

    const roles = sceneValue.roles;
    if (!Array.isArray(roles) || roles.length !== 11) {
      throw new Error(`${context}.roles must contain exactly 11 roles`);
    }
    roles.forEach((roleValue, roleIndex) => {
      const roleContext = `${context}.roles[${roleIndex}]`;
      validateRole(roleValue, questionIds, roleContext, false);
      addUniqueId(roleValue.id, roleContext);
    });

    if (!isRecord(sceneValue.glitch_scene)) {
      throw new Error(`${context}.glitch_scene must be an object`);
    }
    requireString(sceneValue.glitch_scene, "title", `${context}.glitch_scene`);
    requireString(sceneValue.glitch_scene, "description", `${context}.glitch_scene`);

    const glitchRoles = sceneValue.glitch_scene.roles;
    if (!Array.isArray(glitchRoles) || glitchRoles.length !== 2) {
      throw new Error(`${context}.glitch_scene.roles must contain exactly 2 roles`);
    }

    glitchRoles.forEach((roleValue, roleIndex) => {
      const roleContext = `${context}.glitch_scene.roles[${roleIndex}]`;
      validateRole(roleValue, questionIds, roleContext, true);
      const glitchRole = roleValue as GlitcherGlitchRole;
      addUniqueId(glitchRole.id, roleContext);

      const selectedAtMinimumPlayers = roles.slice(
        0,
        GLITCHER_SETTINGS.minPlayers - 1,
      ) as GlitcherRole[];
      const shadowRole = selectedAtMinimumPlayers.find(
        (role) => role.id === glitchRole.shadow_role_id,
      );
      if (!shadowRole) {
        throw new Error(
          `${roleContext}.shadow_role_id must reference a role selected at 6 players`,
        );
      }
    });
  });
}

const parsedGlitcherData: unknown = rawGlitcherData;
validateGlitcherData(parsedGlitcherData);

export const GLITCHER_GAME_DATA: GlitcherGameData = parsedGlitcherData;
export const GLITCHER_SCENES: GlitcherScene[] = GLITCHER_GAME_DATA.scenes;

const SCENE_BY_ID = new Map(GLITCHER_SCENES.map((scene) => [scene.id, scene]));

export function getGlitcherScene(sceneId: string): GlitcherScene | undefined {
  return SCENE_BY_ID.get(sceneId);
}

export function shuffleGlitcherItems<T>(
  values: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createGlitcherSceneDeck(
  random: () => number = Math.random,
): string[] {
  return shuffleGlitcherItems(
    GLITCHER_SCENES.map((scene) => scene.id),
    random,
  );
}

export function getGlitcherDiscussionSeconds(playerCount: number): number {
  if (playerCount >= 11) return 150;
  if (playerCount >= 9) return 120;
  return 90;
}

export function scoreGlitcher(
  totalPlayers: number,
  votesForGlitch: number,
): number {
  if (votesForGlitch === 0) return 2;
  const wrongVotes = totalPlayers - 1 - votesForGlitch;
  const threshold = Math.ceil((totalPlayers - 1) / 2);
  return wrongVotes >= threshold ? 1 : 0;
}
