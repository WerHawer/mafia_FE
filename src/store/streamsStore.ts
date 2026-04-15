import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

export class StreamStore {
  _userBackgroundImages: Record<string, string[]> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Streams_mobx",
      properties: ["_userBackgroundImages"],
      storage: sessionStorage,
    });
  }

  setImageToBackgrounds(userId: string, image: string) {
    if (!userId) return;
    if (!this._userBackgroundImages[userId]) {
      this._userBackgroundImages[userId] = [];
    }
    this._userBackgroundImages[userId] = [
      ...this._userBackgroundImages[userId],
      image,
    ];
  }

  getUserBackgroundImages(userId: string) {
    if (!userId) return [];
    return toJS(this._userBackgroundImages[userId] || []);
  }
}

export const streamStore = new StreamStore();
