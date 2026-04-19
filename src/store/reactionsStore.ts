import { makeAutoObservable, runInAction } from "mobx";

export interface ActiveReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  /** left position in px — randomized per reaction */
  x: number;
  /** flight duration in ms — randomized 3500–5500 */
  duration: number;
  /** wobble amplitude in px — randomized 20–50 */
  wobble: number;
}

interface LatestReaction {
  emoji: string;
  timerId: ReturnType<typeof setTimeout>;
}

const CORNER_BADGE_TTL = 5000; // ms before the corner badge disappears
const MIN_DURATION = 3500;
const MAX_DURATION = 5500;
const MAX_X_FRACTION = 0.28; // max 28% of viewport width for start x

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

class ReactionsStore {
  reactions: ActiveReaction[] = [];
  latestPerUser = new Map<string, LatestReaction>();

  constructor() {
    makeAutoObservable(this);
  }

  addReaction(userId: string, userName: string, emoji: string) {
    const id = `${userId}-${Date.now()}-${Math.random()}`;
    const x = Math.floor(randomBetween(16, window.innerWidth * MAX_X_FRACTION));
    const duration = Math.floor(randomBetween(MIN_DURATION, MAX_DURATION));
    const wobble = Math.floor(randomBetween(20, 50));

    const reaction: ActiveReaction = { id, userId, userName, emoji, x, duration, wobble };

    runInAction(() => {
      this.reactions.push(reaction);
    });

    // Remove from floating list after animation ends
    setTimeout(() => {
      runInAction(() => {
        this.reactions = this.reactions.filter((r) => r.id !== id);
      });
    }, duration + 300); // small buffer after animation

    // Update corner badge — reset TTL if same user sends again
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

  clearUserReaction(userId: string) {
    const existing = this.latestPerUser.get(userId);
    if (existing) {
      clearTimeout(existing.timerId);
      runInAction(() => {
        this.latestPerUser.delete(userId);
      });
    }
  }
}

export const reactionsStore = new ReactionsStore();
