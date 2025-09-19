import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

export class StreamStore {
  _myBackgroundImages: string[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Streams_mobx",
      properties: ["_myBackgroundImages"],
      storage: sessionStorage,
    });
  }

  setImageToBackgrounds(image: string) {
    this._myBackgroundImages = [...this._myBackgroundImages, image];
  }

  // getFilteredStreams({
  //   arrForFilter,
  //   variant = "direct",
  //   myId,
  // }: {
  //   arrForFilter?: UserId[];
  //   variant: "opposite" | "direct";
  //   myId?: UserId;
  // }) {
  //   if (!arrForFilter) return this.streams;
  //
  //   return this.streams.filter((stream) => {
  //     const userId = stream.id;
  //
  //     if (!userId) return true;
  //     if (myId === userId) return true;
  //
  //     return variant === "direct"
  //       ? !arrForFilter.includes(userId)
  //       : arrForFilter.includes(userId);
  //   });
  // }

  get myBackgroundImages() {
    return toJS(this._myBackgroundImages);
  }
}

export const streamStore = new StreamStore();
