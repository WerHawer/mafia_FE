import { makeAutoObservable, toJS } from "mobx";
import { StreamInfo, StreamsArr } from "@/types/socket.types.ts";
import { UserId, UserStreamId, UserVideoSettings } from "@/types/user.types.ts";
import { makePersistable } from "mobx-persist-store";

export class StreamStore {
  _streams: MediaStream[] = [];
  _userStreamsMap: Map<UserStreamId, StreamInfo> = new Map();
  _myStream?: MediaStream;
  _myOriginalStream?: MediaStream;
  _settings: UserVideoSettings = {
    withBlur: true,
    imageURL: "",
  };
  _myBackgroundImages: string[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "Streams_mobx",
      properties: ["_settings", "_myBackgroundImages"],
      storage: sessionStorage,
    });
  }

  setUserStreamsMap(streams: StreamsArr) {
    this._userStreamsMap = new Map(streams);
  }

  setMyStream(stream: MediaStream) {
    this._myStream = stream;
  }

  setMyOriginalStream(stream: MediaStream) {
    this._myOriginalStream = stream;
  }

  resetMyStream() {
    this._myStream?.getTracks().forEach((track) => {
      track.stop();
    });

    this._myOriginalStream?.getTracks().forEach((track) => {
      track.stop();
    });

    this.removeStream(this._myStream?.id as UserStreamId);
    this.removeStream(this._myOriginalStream?.id as UserStreamId);

    this._myStream = undefined;
    this._myOriginalStream = undefined;
  }

  setMockStreams() {
    if (!this.myStream) return;

    this._streams = new Array(8).fill(this.myStream);
  }

  multiplyStreamAndSet(stream: MediaStream, count: number) {
    const streams = new Array(count).fill(stream);

    this._streams = [...this._streams, ...streams];
  }

  setStreams(streams: MediaStream[]) {
    this._streams = streams;
  }

  setStream(stream: MediaStream, maxStreams: number) {
    if (this._streams.length >= maxStreams) return;

    const isStreamExist = this._streams.some((str) => str.id === stream.id);

    if (isStreamExist) return;

    this._streams.push(stream);
  }

  removeStream(streamId: UserStreamId) {
    this._streams = this._streams.filter((stream) => stream.id !== streamId);
  }

  resetStreams() {
    this._streams = [];
  }

  get streams() {
    return toJS(this._streams);
  }

  setVideoSettings(settings: UserVideoSettings) {
    this._settings.imageURL = settings.imageURL;
    this._settings.withBlur = settings.withBlur;
  }

  setImageToBackgrounds(image: string) {
    this._myBackgroundImages = [...this._myBackgroundImages, image];
  }

  getFilteredStreams({
    arrForFilter,
    variant = "direct",
    myId,
  }: {
    arrForFilter?: UserId[];
    variant: "opposite" | "direct";
    myId?: UserId;
  }) {
    if (!arrForFilter) return this.streams;

    return this.streams.filter((stream) => {
      const userId = this.getUserStreamInfo(stream.id)?.user.id;

      if (!userId) return true;
      if (myId === userId) return true;

      return variant === "direct"
        ? !arrForFilter.includes(userId)
        : arrForFilter.includes(userId);
    });
  }

  get myStream() {
    return toJS(this._myStream);
  }

  get myOriginalStream() {
    return toJS(this._myOriginalStream);
  }

  get userStreamsMap() {
    return toJS(this._userStreamsMap);
  }

  getUserStreamInfo(streamId: UserStreamId) {
    return toJS(this._userStreamsMap.get(streamId));
  }

  get streamsLength() {
    return this.streams.length;
  }

  get videoSettings() {
    return toJS(this._settings);
  }

  get myBackgroundImages() {
    return toJS(this._myBackgroundImages);
  }

  manageStreamTracks(streams: MediaStream[], myId: UserId, isIGm: boolean) {
    streams.forEach((stream) => {
      const streamId = stream.id;

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      const userStreamData = this.getUserStreamInfo(streamId);

      if (!userStreamData) return;

      const { audio = true, video = true, offParams } = userStreamData.user;
      const { useTo } = userStreamData;
      const isSelfMute = offParams === "self";

      if (streamId === this.myStream?.id && !isSelfMute) return;
      if (isIGm && !isSelfMute) return;

      if (useTo && !isSelfMute) {
        const isForMe = useTo.includes(myId);

        audioTrack.enabled = isForMe ? audio : !audio;
        videoTrack.enabled = isForMe ? video : !video;

        return;
      }

      audioTrack.enabled = audio;
      videoTrack.enabled = video;
    });
  }
}

export const streamStore = new StreamStore();
