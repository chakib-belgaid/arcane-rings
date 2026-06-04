import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GameAudioController, musicVolume } from "./gameAudio";

type AudioInstance = {
  loop: boolean;
  preload: string;
  src: string;
  volume: number;
  playbackRate: number;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
};

describe("GameAudioController", () => {
  let instances: AudioInstance[];

  beforeEach(() => {
    instances = [];

    class MockAudio {
      loop = false;
      preload = "";
      volume = 1;
      playbackRate = 1;
      pause = vi.fn();
      play = vi.fn(() => Promise.resolve());

      constructor(public src = "") {
        instances.push(this);
      }
    }

    vi.stubGlobal("Audio", MockAudio);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("starts looped music from the first audible user action", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: true, soundEffects: true });

    controller.playSfx("uiSelect");

    const music = instances.find((instance) => instance.src.endsWith("circles_01_moonlit_garden_menu_loop.wav"));
    const sfx = instances.find((instance) => instance.src.endsWith("sfx_ui_select_01.wav"));

    expect(music).toBeTruthy();
    expect(music?.loop).toBe(true);
    expect(music?.volume).toBe(musicVolume);
    expect(music?.play).toHaveBeenCalledTimes(1);
    expect(sfx?.play).toHaveBeenCalledTimes(1);
  });

  test("does not start music when the music setting is disabled", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: false, soundEffects: true });

    controller.playSfx("uiSelect");

    const music = instances.find((instance) => instance.src.endsWith("circles_01_moonlit_garden_menu_loop.wav"));
    const sfx = instances.find((instance) => instance.src.endsWith("sfx_ui_select_01.wav"));

    expect(music).toBeFalsy();
    expect(sfx?.play).toHaveBeenCalledTimes(1);
  });

  test("switches from menu to gameplay background music", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: true, soundEffects: true });

    controller.playSfx("uiSelect");
    controller.setMusicTrack("gameplay");

    const menuMusic = instances.find((instance) => instance.src.endsWith("circles_01_moonlit_garden_menu_loop.wav"));
    const gameplayMusic = instances.find((instance) =>
      instance.src.endsWith("circles_02_emerald_rotation_gameplay_loop.wav")
    );

    expect(menuMusic?.pause).toHaveBeenCalledTimes(1);
    expect(gameplayMusic).toBeTruthy();
    expect(gameplayMusic?.loop).toBe(true);
    expect(gameplayMusic?.volume).toBe(musicVolume);
    expect(gameplayMusic?.play).toHaveBeenCalledTimes(1);
  });

  test("uses the provided solved stinger for completion", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: false, soundEffects: true });

    controller.playSfx("complete");

    const stinger = instances.find((instance) => instance.src.endsWith("circles_03_circle_solved_success_stinger.wav"));

    expect(stinger).toBeTruthy();
    expect(stinger?.loop).toBe(false);
    expect(stinger?.play).toHaveBeenCalledTimes(1);
  });

  test("plays a clockwork tick sequence for multi-tick ring rotations", () => {
    vi.useFakeTimers();

    const controller = new GameAudioController();
    controller.setSettings({ music: false, soundEffects: true });

    controller.playClockworkRotation(3);

    expect(instances.filter((instance) => instance.src.endsWith("sfx_puzzle_tick_01.wav"))).toHaveLength(1);

    vi.advanceTimersByTime(38);
    expect(instances.filter((instance) => instance.src.endsWith("sfx_puzzle_tick_01.wav"))).toHaveLength(2);

    vi.advanceTimersByTime(38);
    expect(instances.filter((instance) => instance.src.endsWith("sfx_puzzle_tick_01.wav"))).toHaveLength(3);
  });

  test("does not play clockwork ticks when sound effects are disabled", () => {
    vi.useFakeTimers();

    const controller = new GameAudioController();
    controller.setSettings({ music: false, soundEffects: false });

    controller.playClockworkRotation(4);
    vi.runAllTimers();

    expect(instances.filter((instance) => instance.src.endsWith("sfx_puzzle_tick_01.wav"))).toHaveLength(0);
  });

  test("scales music and sound effects with the master volume", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: true, soundEffects: true, volume: 0.5 });

    controller.playSfx("uiSelect");

    const music = instances.find((instance) => instance.src.endsWith("circles_01_moonlit_garden_menu_loop.wav"));
    const sfx = instances.find((instance) => instance.src.endsWith("sfx_ui_select_01.wav"));

    expect(music?.volume).toBeCloseTo(musicVolume * 0.5);
    expect(sfx?.volume).toBeCloseTo(0.55 * 0.5);
  });

  test("updates active music volume when settings change", () => {
    const controller = new GameAudioController();
    controller.setSettings({ music: true, soundEffects: true, volume: 1 });

    controller.playSfx("uiSelect");
    const music = instances.find((instance) => instance.src.endsWith("circles_01_moonlit_garden_menu_loop.wav"));

    controller.setSettings({ music: true, soundEffects: true, volume: 0.25 });

    expect(music?.volume).toBeCloseTo(musicVolume * 0.25);
  });
});
