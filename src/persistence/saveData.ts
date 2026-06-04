export type UserSettings = {
  reducedMotion: boolean;
  soundEffects: boolean;
  music: boolean;
  haptics: boolean;
  showReferenceDefault: boolean;
  highContrastBorders: boolean;
};

export type LevelProgress = {
  levelId: string;
  solved: boolean;
  bestStars: 0 | 1 | 2 | 3;
  bestMoveCount: number | null;
  bestTimeMs: number | null;
  completedAt: string | null;
};

export type DailyProgress = {
  dateKey: string;
  levelId: string;
  solved: boolean;
  stars: 0 | 1 | 2 | 3;
  moveCount: number | null;
  timeMs: number | null;
};

export type SaveData = {
  schemaVersion: 1;
  settings: UserSettings;
  levelProgress: Record<string, LevelProgress>;
  dailyProgress: Record<string, DailyProgress>;
  unlockedImageIds: string[];
};

export const saveKey = "project-circles-save-v1";

export const defaultSettings: UserSettings = {
  reducedMotion: false,
  soundEffects: true,
  music: true,
  haptics: true,
  showReferenceDefault: true,
  highContrastBorders: false
};

export function createDefaultSaveData(): SaveData {
  return {
    schemaVersion: 1,
    settings: defaultSettings,
    levelProgress: {},
    dailyProgress: {},
    unlockedImageIds: []
  };
}

export function parseSaveData(raw: string | null): SaveData {
  if (!raw) {
    return createDefaultSaveData();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.schemaVersion !== 1) {
      return createDefaultSaveData();
    }

    return {
      schemaVersion: 1,
      settings: {
        ...defaultSettings,
        ...(isRecord(parsed.settings) ? parsed.settings : {})
      },
      levelProgress: isRecord(parsed.levelProgress) ? (parsed.levelProgress as SaveData["levelProgress"]) : {},
      dailyProgress: isRecord(parsed.dailyProgress) ? (parsed.dailyProgress as SaveData["dailyProgress"]) : {},
      unlockedImageIds: Array.isArray(parsed.unlockedImageIds) ? parsed.unlockedImageIds.filter(isString) : []
    };
  } catch {
    return createDefaultSaveData();
  }
}

export function serializeSaveData(saveData: SaveData): string {
  return JSON.stringify(saveData);
}

export function loadSaveData(storage: Pick<Storage, "getItem"> = window.localStorage): SaveData {
  return parseSaveData(storage.getItem(saveKey));
}

export function persistSaveData(saveData: SaveData, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  storage.setItem(saveKey, serializeSaveData(saveData));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
