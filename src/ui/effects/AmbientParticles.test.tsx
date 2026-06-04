import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AmbientParticles } from "./AmbientParticles";

describe("AmbientParticles", () => {
  test("renders deterministic non-interactive menu particles", () => {
    const firstRender = renderToStaticMarkup(<AmbientParticles variant="menu" />);
    const secondRender = renderToStaticMarkup(<AmbientParticles variant="menu" />);

    expect(firstRender).toBe(secondRender);
    expect(firstRender).toContain('class="ambient-particles ambient-particles--menu"');
    expect(firstRender).toContain('aria-hidden="true"');
    expect(firstRender.match(/class="ambient-particle"/g)).toHaveLength(18);
    expect(firstRender.match(/class="ambient-wisp"/g)).toHaveLength(6);
    expect(firstRender).toContain("--particle-x:12%;--particle-y:18%;");
    expect(firstRender).toContain("--wisp-x:14%;--wisp-y:28%;");
  });

  test("renders fewer particles for the in-game layer", () => {
    const markup = renderToStaticMarkup(<AmbientParticles variant="game" />);

    expect(markup).toContain('class="ambient-particles ambient-particles--game"');
    expect(markup.match(/class="ambient-particle"/g)).toHaveLength(10);
    expect(markup.match(/class="ambient-wisp"/g)).toHaveLength(4);
  });
});
