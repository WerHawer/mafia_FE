import { makeAutoObservable, toJS } from "mobx";
import { makePersistable } from "mobx-persist-store";

import { StreamInfo, StreamsArr } from "@/types/socket.types.ts";
import { UserId, UserStreamId, UserVideoSettings } from "@/types/user.types.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";

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
      properties: ["_settings", "_myBackgroundImages", "_streams"],
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

  setMockStreams(count: number = 8) {
    if (!this.myStream) return;

    this._streams = [...new Array(count).fill(this.myStream)];
  }

  createMockStreamsForPlayers() {
    const { activeGamePlayers, activeGameId } = gamesStore;
    const { myId } = usersStore;

    if (!activeGameId) return;

    // Reset existing streams
    this.resetStreams();

    // Create a new Map for user streams
    const newUserStreamsMap = new Map<UserStreamId, StreamInfo>();

    // Create or use existing my stream
    let myMockStream = this.myStream;

    // If no myStream exists, create a mock one for testing
    if (!myMockStream && myId) {
      try {
        myMockStream = new MediaStream();

        // Add a unique ID to the stream
        Object.defineProperty(myMockStream, "id", {
          value: `mock-stream-my-${myId}`,
          writable: false,
        });

        // If we have the original stream from the camera, add its tracks to our mock stream
        if (this._myOriginalStream) {
          // Add video tracks from the original stream to the mock stream
          const videoTracks = this._myOriginalStream.getVideoTracks();
          if (videoTracks.length > 0) {
            myMockStream.addTrack(videoTracks[0]);
          }

          // Add audio tracks from the original stream to the mock stream
          const audioTracks = this._myOriginalStream.getAudioTracks();
          if (audioTracks.length > 0) {
            myMockStream.addTrack(audioTracks[0]);
          }
        }

        // Set as my stream
        this._myStream = myMockStream;

        // Note: This mock stream now has tracks if myOriginalStream was available
        // Otherwise, the manageStreamTracks method has null checks to handle this
      } catch (error) {
        console.error("Error creating mock stream for current user:", error);
      }
    }

    // Add my stream to the map if it exists
    if (myMockStream && myId) {
      const myStreamInfo: StreamInfo = {
        roomId: activeGameId,
        user: {
          id: myId,
          audio: true,
          video: true,
        },
      };

      newUserStreamsMap.set(myMockStream.id, myStreamInfo);
      this._streams.push(myMockStream);
    }

    // Create mock streams for each player
    activeGamePlayers.forEach((playerId, index) => {
      // Skip if this is the current user
      if (playerId === myId) return;

      try {
        // Create a mock MediaStream
        // For testing purposes, we'll create a stream
        const mockStream = new MediaStream();

        // Add a unique ID to the stream to differentiate it
        Object.defineProperty(mockStream, "id", {
          value: `mock-stream-${playerId}-${index}`,
          writable: false,
        });

        // If we have the original stream from the camera, add its video track to this mock stream too
        // This will make all players appear to have the same video (for testing purposes)
        if (this._myOriginalStream) {
          const videoTracks = this._myOriginalStream.getVideoTracks();
          if (videoTracks.length > 0) {
            // Clone the track so we can use it in multiple streams
            mockStream.addTrack(videoTracks[0].clone());
          }
        }

        // Create StreamInfo for this player
        const streamInfo: StreamInfo = {
          roomId: activeGameId,
          user: {
            id: playerId,
            audio: true,
            video: true,
          },
        };

        // Add to maps
        newUserStreamsMap.set(mockStream.id, streamInfo);
        this._streams.push(mockStream);
      } catch (error) {
        console.error("Error creating mock stream:", error);
      }
    });

    // Update the userStreamsMap
    this._userStreamsMap = newUserStreamsMap;
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

        if (audioTrack) audioTrack.enabled = isForMe ? audio : !audio;
        if (videoTrack) videoTrack.enabled = isForMe ? video : !video;

        return;
      }

      if (audioTrack) audioTrack.enabled = audio;
      if (videoTrack) videoTrack.enabled = video;
    });
  }
}

export const streamStore = new StreamStore();
