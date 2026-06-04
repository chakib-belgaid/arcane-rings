export const SETTINGS_STORAGE_KEY = "project-circles:settings";

export const BEST_SCORE_STORAGE_PREFIX = "arcane-rings:best-score:";
export const LEGACY_BEST_SCORE_STORAGE_PREFIX = "project-circles:best-score:";

export const BEST_SCORE_STORAGE_PREFIXES_TO_CLEAR = [
  BEST_SCORE_STORAGE_PREFIX,
  LEGACY_BEST_SCORE_STORAGE_PREFIX,
] as const;

export function bestScoreStorageKey(levelId: string, imageTitle: string): string {
  return `${BEST_SCORE_STORAGE_PREFIX}${levelId}:${imageTitle}`;
}
