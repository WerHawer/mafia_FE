import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { getAudioPath } from "@/helpers/getAudioPath";

export enum SoundEffect {
  Shot = "shot.wav",
  Kiss = "kiss.m4a",
  Heal = "heal.wav",
  Check = "night_check.mp3",
  Vote = "vote_click.wav",
  Killed = "night_switch.wav", // Using transition sound for death as placeholder or keep as is
  NightStart = "night_switch.wav",
  DayStart = "day_switch.wav",
  Deal = "dealing-card.wav",
  Ticking = "ticking-clock.wav",
  Connect = "new_player_conected.wav",
}

export class SoundStore {
  musicVolume = 0.3;
  sfxVolume = 0.2;
  isMuted = false;

  private activeMusicObject: HTMLAudioElement | null = null;
  private preloadedAudios: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    void makePersistable(this, {
      name: "Mafia_SoundStore",
      properties: ["musicVolume", "sfxVolume", "isMuted"],
      storage: localStorage,
    });

    // Defer audio preloading until the browser is idle (lowest priority).
    // This prevents audio network requests from competing with the initial page render.
    this.schedulePreload();
  }

  private schedulePreload() {
    const doPreload = () => this.preloadAllAudio();

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(doPreload, { timeout: 5000 });
    } else {
      // Fallback for Safari which doesn't support requestIdleCallback
      setTimeout(doPreload, 3000);
    }
  }

  private preloadAllAudio() {
    // Preload all SFX from enum
    Object.values(SoundEffect).forEach(effect => {
      this.preloadAudio(effect);
    });

    // Preload background music tracks
    const bgTracks = [
      "day_bg.mp3", "day_bg_1.mp3", "day_bg_2.mp3",
      "night_bg.mp3", "night_bg_2.mp3", "night_bg_3.mp3"
    ];

    bgTracks.forEach(track => {
      this.preloadAudio(track);
    });
  }

  private preloadAudio(filename: string) {
    if (this.preloadedAudios.has(filename)) return;

    try {
      const audioPath = getAudioPath(filename);
      const audio = new Audio(audioPath);
      // "metadata" first — loads only duration/format, not the full file.
      // The full file will be fetched on first play (or when explicitly needed).
      audio.preload = "metadata";
      this.preloadedAudios.set(filename, audio);
    } catch (e) {
      console.warn(`Failed to preload audio: ${filename}`, e);
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.activeMusicObject) {
      this.activeMusicObject.volume = this.effectiveMusicVolume;
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = volume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.activeMusicObject) {
      this.activeMusicObject.muted = this.isMuted;
    }
  }

  get effectiveMusicVolume() {
    return this.isMuted ? 0 : this.musicVolume;
  }

  get effectiveSfxVolume() {
    return this.isMuted ? 0 : this.sfxVolume;
  }

  playSfx(effect: SoundEffect | string, volumeMultiplier = 1, durationMs?: number) {
    if (this.isMuted) return;

    try {
      // Try to get preloaded audio, or create a new one if not found
      let audio = this.preloadedAudios.get(effect);

      if (!audio) {
        const audioPath = getAudioPath(effect);
        audio = new Audio(audioPath);
        this.preloadedAudios.set(effect, audio);
      }

      // We need to clone the audio node if we want to play the same sound overlapping
      const sfx = audio.cloneNode() as HTMLAudioElement;
      sfx.volume = this.effectiveSfxVolume * volumeMultiplier;
      sfx
        .play()
        .catch((e) => console.warn(`Failed to play SFX: ${effect}`, e));

      // If duration is specified, stop the audio after that time
      if (durationMs) {
        setTimeout(() => {
          sfx.pause();
          sfx.currentTime = 0;
        }, durationMs);
      }
    } catch (e) {
      console.error(`Error playing SFX: ${effect}`, e);
    }
  }

  /**
   * Plays music. If an array of tracks is provided, picks one randomly.
   */
  playMusic(tracks: string | string[], loop = true, volumeMultiplier = 1) {
    if (this.activeMusicObject) {
      this.activeMusicObject.pause();
      this.activeMusicObject = null;
    }

    const trackName = Array.isArray(tracks)
      ? tracks[Math.floor(Math.random() * tracks.length)]
      : tracks;

    try {
      let audio = this.preloadedAudios.get(trackName);

      if (!audio) {
        const audioPath = getAudioPath(trackName);
        audio = new Audio(audioPath);
        this.preloadedAudios.set(trackName, audio);
      }

      // Clone Node to allow restarting the same track easily
      // without worrying about internal audio state from previous plays
      const bgm = audio.cloneNode() as HTMLAudioElement;
      bgm.volume = this.effectiveMusicVolume * volumeMultiplier;
      bgm.loop = loop;
      bgm.muted = this.isMuted;

      this.activeMusicObject = bgm;
      bgm.play().catch((e) => {
        console.warn(`Autoplay blocked or track missing: ${trackName}`, e);
      });
    } catch (e) {
      console.error(`Error playing music: ${trackName}`, e);
    }
  }

  stopMusic() {
    if (this.activeMusicObject) {
      this.activeMusicObject.pause();
      this.activeMusicObject = null;
    }
  }
}

export const soundStore = new SoundStore();
