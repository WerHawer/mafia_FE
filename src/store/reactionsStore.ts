import { makeAutoObservable, runInAction } from "mobx";

export interface ActiveReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  /** Horizontal start position as a fraction of the canvas width (0..1) */
  xFraction: number;
  /** Flight duration in ms — randomized */
  duration: number;
  /** Wobble amplitude in px — randomized */
  wobble: number;
  /** Base emoji size in CSS px — randomized so reactions vary visually */
  size: number;
  /** Vertical end position as a fraction of canvas height counted from bottom (0..1) */
  endYFraction: number;
  /** Time when the reaction was queued (used for diagnostics / safety TTL) */
  addedAt: number;
  /** Time when the animation actually started (set after the PNG is ready). Null = waiting for image. */
  startedAt: number | null;
}

interface LatestReaction {
  emoji: string;
  timerId: ReturnType<typeof setTimeout>;
}

const CORNER_BADGE_TTL = 5000;
const MIN_DURATION = 3000;
const MAX_DURATION = 6500;
const MIN_X_FRACTION = 0.04;
const MAX_X_FRACTION = 0.92;
const MIN_WOBBLE = 3;
const MAX_WOBBLE = 10;
const MIN_SIZE = 32;
const MAX_SIZE = 42;
const MIN_END_Y_FRACTION = 0.55;
const MAX_END_Y_FRACTION = 0.9;
const ANIMATION_TAIL_MS = 300;
/** Hard timeout for reactions whose PNG never loads (CDN failure etc.) */
const STALE_REACTION_TTL_MS = 10000;
/** Cap concurrent reactions to keep canvas work bounded */
const MAX_CONCURRENT_REACTIONS = 40;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

class ReactionsStore {
  reactions: ActiveReaction[] = [];
  latestPerUser = new Map<string, LatestReaction>();

  constructor() {
    makeAutoObservable(this);
  }

  addReaction(userId: string, userName: string, emoji: string) {
    if (this.reactions.length >= MAX_CONCURRENT_REACTIONS) return;

    const id = `${userId}-${Date.now()}-${Math.random()}`;
    const now = Date.now();

    const reaction: ActiveReaction = {
      id,
      userId,
      userName,
      emoji,
      xFraction: randomBetween(MIN_X_FRACTION, MAX_X_FRACTION),
      duration: Math.floor(randomBetween(MIN_DURATION, MAX_DURATION)),
      wobble: Math.floor(randomBetween(MIN_WOBBLE, MAX_WOBBLE)),
      size: Math.floor(randomBetween(MIN_SIZE, MAX_SIZE + 1)),
      endYFraction: randomBetween(MIN_END_Y_FRACTION, MAX_END_Y_FRACTION),
      addedAt: now,
      startedAt: null,
    };

    runInAction(() => {
      this.reactions.push(reaction);
    });

    setTimeout(() => {
      runInAction(() => {
        this.reactions = this.reactions.filter(
          (r) => r.id !== id || r.startedAt !== null
        );
      });
    }, STALE_REACTION_TTL_MS);

    this.updateCornerBadge(userId, emoji);
  }

  /**
   * Marks a reaction as started; the canvas calls this once the emoji image is ready.
   * Schedules removal after the animation (plus a small tail) has finished.
   */
  markStarted(id: string, startedAt: number) {
    const target = this.reactions.find((r) => r.id === id);
    if (!target || target.startedAt !== null) return;

    runInAction(() => {
      target.startedAt = startedAt;
    });

    setTimeout(() => {
      runInAction(() => {
        this.reactions = this.reactions.filter((r) => r.id !== id);
      });
    }, target.duration + ANIMATION_TAIL_MS);
  }

  clearUserReaction(userId: string) {
    const existing = this.latestPerUser.get(userId);
    if (existing) {
      clearTimeout(existing.timerId);
      runInAction(() => {
        this.latestPerUser.delete(userId);
      });
    }
  }

  private updateCornerBadge(userId: string, emoji: string) {
    const existing = this.latestPerUser.get(userId);
    if (existing) clearTimeout(existing.timerId);

    const timerId = setTimeout(() => {
      runInAction(() => {
        this.latestPerUser.delete(userId);
      });
    }, CORNER_BADGE_TTL);

    runInAction(() => {
      this.latestPerUser.set(userId, { emoji, timerId });
    });
  }
}

export const reactionsStore = new ReactionsStore();
