import { describe, expect, test } from "vitest";
import { defaultSettings, parseSaveData, serializeSaveData } from "./saveData";

describe("save data", () => {
  test("falls back to defaults for missing or malformed data", () => {
    expect(parseSaveData(null).settings).toEqual(defaultSettings);
    expect(parseSaveData("{broken").settings).toEqual(defaultSettings);
    expect(parseSaveData(JSON.stringify({ schemaVersion: 1, settings: { reducedMotion: true } })).settings)
      .toMatchObject({ ...defaultSettings, reducedMotion: true });
  });

  test("serializes versioned progress without renderer state", () => {
    const json = serializeSaveData({
      schemaVersion: 1,
      settings: defaultSettings,
      levelProgress: {
        "grove-001": {
          levelId: "grove-001",
          solved: true,
          bestStars: 3,
          bestMoveCount: 8,
          bestTimeMs: 9000,
          completedAt: "2026-06-03T00:00:00.000Z"
        }
      },
      dailyProgress: {},
      unlockedImageIds: ["grove-path"]
    });

    expect(json).toContain("\"schemaVersion\":1");
    expect(json).not.toContain("canvas");
    expect(json).not.toContain("renderer");
  });
});
