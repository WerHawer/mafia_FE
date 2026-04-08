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
  musicVolume = 0.03;
  sfxVolume = 0.2;
  isMuted = false;

  private activeMusicObject: HTMLAudioElement | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    void makePersistable(this, {
      name: "Mafia_SoundStore",
      properties: ["musicVolume", "sfxVolume", "isMuted"],
      storage: localStorage,
    });
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
      const audioPath = getAudioPath(effect);
      const audio = new Audio(audioPath);
      audio.volume = this.effectiveSfxVolume * volumeMultiplier;
      audio
        .play()
        .catch((e) => console.warn(`Failed to play SFX: ${effect}`, e));

      // If duration is specified, stop the audio after that time
      if (durationMs) {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
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
      const audioPath = getAudioPath(trackName);
      const audio = new Audio(audioPath);
      audio.volume = this.effectiveMusicVolume * volumeMultiplier;
      audio.loop = loop;
      audio.muted = this.isMuted;

      this.activeMusicObject = audio;
      audio.play().catch((e) => {
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
