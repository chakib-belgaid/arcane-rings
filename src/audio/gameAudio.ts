export type SoundEffect =
  | "uiSelect"
  | "uiBack"
  | "ringSelect"
  | "ringTick"
  | "hint"
  | "reference"
  | "coupling"
  | "complete"
  | "blocked";

export type AudioSettings = {
  soundEffects: boolean;
  music: boolean;
  volume?: number;
};

export type MusicTrack = "menu" | "gameplay";

type SoundSpec = {
  src: string;
  volume: number;
  cooldownMs?: number;
  pitchVariance?: number;
};

const musicSources: Record<MusicTrack, string> = {
  menu: "/assets/audio/circles_01_moonlit_garden_menu_loop.wav",
  gameplay: "/assets/audio/circles_02_emerald_rotation_gameplay_loop.wav"
};
export const musicVolume = 0.52;
const defaultMasterVolume = 1;
const clockworkStepMs = 38;
const maxClockworkTicks = 8;

const soundEffects: Record<SoundEffect, SoundSpec> = {
  uiSelect: {
    src: "/assets/audio/sfx_ui_select_01.wav",
    volume: 0.55,
    cooldownMs: 45,
    pitchVariance: 0.015
  },
  uiBack: {
    src: "/assets/audio/sfx_ui_back_01.wav",
    volume: 0.5,
    cooldownMs: 45,
    pitchVariance: 0.01
  },
  ringSelect: {
    src: "/assets/audio/sfx_puzzle_ring_select_01.wav",
    volume: 0.46,
    cooldownMs: 70,
    pitchVariance: 0.02
  },
  ringTick: {
    src: "/assets/audio/sfx_puzzle_tick_01.wav",
    volume: 0.66,
    cooldownMs: 45,
    pitchVariance: 0.025
  },
  hint: {
    src: "/assets/audio/sfx_puzzle_hint_01.wav",
    volume: 0.58,
    cooldownMs: 220,
    pitchVariance: 0.01
  },
  reference: {
    src: "/assets/audio/sfx_puzzle_reference_01.wav",
    volume: 0.5,
    cooldownMs: 160
  },
  coupling: {
    src: "/assets/audio/sfx_puzzle_coupling_open_01.wav",
    volume: 0.52,
    cooldownMs: 160
  },
  complete: {
    src: "/assets/audio/circles_03_circle_solved_success_stinger.wav",
    volume: 0.74,
    cooldownMs: 1000
  },
  blocked: {
    src: "/assets/audio/sfx_puzzle_blocked_01.wav",
    volume: 0.42,
    cooldownMs: 120
  }
};

export class GameAudioController {
  private settings: Required<AudioSettings> = { soundEffects: true, music: true, volume: defaultMasterVolume };
  private music: HTMLAudioElement | null = null;
  private musicTrack: MusicTrack = "menu";
  private unlocked = false;
  private lastPlayedAt = new Map<SoundEffect, number>();
  private preloaded = false;

  preload() {
    if (this.preloaded || !canUseAudio()) {
      return;
    }

    this.preloaded = true;
    Object.values(musicSources).forEach((src) => {
      const audio = new Audio(src);
      audio.preload = "auto";
    });
    Object.values(soundEffects).forEach((sound) => {
      const audio = new Audio(sound.src);
      audio.preload = "auto";
    });
  }

  setSettings(settings: AudioSettings) {
    this.settings = {
      ...settings,
      volume: normalizeVolume(settings.volume, this.settings.volume)
    };

    if (this.music) {
      this.music.volume = musicVolume * this.settings.volume;
    }

    if (!settings.music) {
      this.stopMusic();
      return;
    }

    if (this.unlocked) {
      this.startMusic();
    }
  }

  setMusicTrack(track: MusicTrack) {
    if (this.musicTrack === track) {
      if (this.unlocked) {
        this.startMusic();
      }
      return;
    }

    this.stopMusic();
    this.musicTrack = track;
    this.music = null;

    if (this.unlocked) {
      this.startMusic();
    }
  }

  unlock() {
    this.unlocked = true;
    this.startMusic();
  }

  startMusic() {
    if (!this.settings.music || !this.unlocked || !canUseAudio()) {
      return;
    }

    const music = this.ensureMusic(this.musicTrack);
    if (!music) {
      return;
    }

    playSafely(music);
  }

  stopMusic() {
    if (!this.music) {
      return;
    }

    this.music.pause();
  }

  playSfx(effect: SoundEffect) {
    this.unlock();

    if (!this.settings.soundEffects || !canUseAudio()) {
      return;
    }

    this.playEffect(effect);
  }

  playClockworkRotation(tickCount: number) {
    this.unlock();

    if (!this.settings.soundEffects || !canUseAudio()) {
      return;
    }

    const ticks = Math.min(maxClockworkTicks, Math.max(1, Math.round(Math.abs(tickCount))));
    for (let index = 0; index < ticks; index += 1) {
      const play = () => {
        this.playEffect("ringTick", {
          ignoreCooldown: true,
          playbackRateOffset: (index % 4) * 0.018
        });
      };

      if (index === 0) {
        play();
      } else {
        window.setTimeout(play, index * clockworkStepMs);
      }
    }
  }

  private playEffect(
    effect: SoundEffect,
    options: { ignoreCooldown?: boolean; playbackRateOffset?: number } = {}
  ) {
    const spec = soundEffects[effect];
    const now = nowMs();
    const lastPlayedAt = this.lastPlayedAt.get(effect) ?? -Infinity;
    if (!options.ignoreCooldown && spec.cooldownMs && now - lastPlayedAt < spec.cooldownMs) {
      return;
    }

    this.lastPlayedAt.set(effect, now);

    const audio = new Audio(spec.src);
    audio.preload = "auto";
    audio.volume = spec.volume * this.settings.volume;
    if (spec.pitchVariance) {
      const variance = spec.pitchVariance;
      audio.playbackRate = 1 + (Math.random() * 2 - 1) * variance + (options.playbackRateOffset ?? 0);
    }
    playSafely(audio);
  }

  private ensureMusic(track: MusicTrack) {
    if (!canUseAudio()) {
      return null;
    }

    if (!this.music) {
      this.music = new Audio(musicSources[track]);
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.volume = musicVolume * this.settings.volume;
    }

    return this.music;
  }
}

function normalizeVolume(volume: number | undefined, fallback: number) {
  if (typeof volume !== "number" || !Number.isFinite(volume)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, volume));
}

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function nowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function playSafely(audio: HTMLAudioElement) {
  try {
    const result = audio.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => undefined);
    }
  } catch {
    // Audio is additive feedback. Browsers and tests can deny playback safely.
  }
}

export const gameAudio = new GameAudioController();
