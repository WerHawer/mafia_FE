import {
  RemoteParticipant,
  RemoteTrack,
  RoomEvent,
  Track,
  TrackPublication,
} from "livekit-client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useUnmount } from "react-use";

import { useGetLiveKitTokenMutation } from "@/api/livekit/queries.ts";
import { streamStore } from "@/store/streamsStore.ts";

import { wsEvents } from "../config/wsEvents.ts";
import { useLiveKit } from "./useLiveKit.ts";
import { useSocket } from "./useSocket.ts";

const MAX_STREAMS = 11;
const CANVAS_FPS = 30;
const DEFAULT_CANVAS_SIZE = { width: 640, height: 480 };

type UseStreamsParams = {
  myStream?: MediaStream;
  myId: string;
  activeGamePlayers: string[];
};

// Stream tracking for deduplication
interface StreamTracker {
  participantId: string;
  trackSid?: string;
  streamId: string;
  canvas?: HTMLCanvasElement;
  animationId?: number;
  element?: HTMLVideoElement;
}

export const useStreams = ({ myStream, myId }: UseStreamsParams) => {
  const { id: roomId = "" } = useParams();
  const { subscribe, sendMessage } = useSocket();
  const { setStream, removeStream, resetStreams, streams, userStreamsMap } =
    streamStore;
  const { mutateAsync: getToken } = useGetLiveKitTokenMutation();

  const {
    room,
    isConnected,
    participants,
    localParticipant,
    connectToRoom,
    disconnect,
  } = useLiveKit(myId, roomId);
};
