export interface GameplayTimerConfig {
  enabled: boolean;
  durationMs: number;
}

export type RoomTimingConfig<Phase extends string = string> = Record<
  Phase,
  GameplayTimerConfig
>;

export function disabledGameplayTimer(durationMs = 0): GameplayTimerConfig {
  return { enabled: false, durationMs };
}

export function enabledGameplayTimer(durationMs: number): GameplayTimerConfig {
  return { enabled: true, durationMs: Math.max(0, durationMs) };
}

export function configuredDurationMs(
  config: GameplayTimerConfig,
): number | null {
  return config.enabled && config.durationMs > 0 ? config.durationMs : null;
}
