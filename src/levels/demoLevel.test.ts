import { describe, expect, test } from "vitest";
import { matVecMod, modNorm } from "../math/mod";
import { demoLevel } from "./demoLevel";

describe("demo level", () => {
  test("keeps the showable level hard without full coupling map help", () => {
    expect(demoLevel.difficultyName).toBe("hard");
    expect(demoLevel.showCouplingHints).toBe(false);
  });

  test("hidden solution solves the bundled scramble", () => {
    const solvedOffsets = demoLevel.initialOffsets.map((offset, index) =>
      modNorm(offset + matVecMod(demoLevel.matrix, demoLevel.solution, demoLevel.q)[index], demoLevel.q)
    );

    expect(solvedOffsets).toEqual([0, 0, 0, 0, 0]);
  });
});
