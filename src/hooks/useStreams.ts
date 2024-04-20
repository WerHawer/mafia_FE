import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useUserMediaStream } from "./useUserMediaStream.ts";
import { usePeer } from "./usePeer.ts";
import Peer from "peerjs";
import { wsEvents } from "../config/wsEvents.ts";
import { usersStore } from "../store/usersStore.ts";
import { useSocket } from "./useSocket.ts";

const MAX_STREAMS = 11;

export const useStreams = () => {
  const { id = "" } = useParams();
  const [streams, setStreams] = useState<MediaStream[]>([]);
  const { subscribe, sendMessage } = useSocket();
  const { myId } = usersStore;

  const userMediaStream = useUserMediaStream({
    audio: true,
    video: true,
  });

  const { peer, peerId } = usePeer(userMediaStream?.id);

  const addVideoStream = useCallback((stream: MediaStream) => {
    // const fakeStreams: MediaStream[] = [];
    // const videoCount = 12;
    //
    // for (let i = 0; i < videoCount; i++) {
    //   fakeStreams.push(stream);
    // }

    setStreams((prev) => {
      if (prev.length >= MAX_STREAMS) return prev;

      const isStreamExist = prev.find((item) => item.id === stream.id);

      if (isStreamExist) return prev;

      return [...prev, stream];

      // return fakeStreams;
    });
  }, []);

  const removeVideoStream = useCallback((id: string) => {
    setStreams((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const connectToNewUser = useCallback(
    (
      otherUserId: string,
      stream: MediaStream,
      peer: Peer,
      cb: (userMediaStream: MediaStream) => void,
    ) => {
      const call = peer.call(otherUserId, stream);

      call.on(wsEvents.stream, (userMediaStream) => {
        cb(userMediaStream);
      });

      return call;
    },
    [],
  );

  useEffect(() => {
    if (!userMediaStream || !myId) return;

    sendMessage(wsEvents.roomConnection, [id, myId, userMediaStream.id]);

    const unsubscribe = subscribe(wsEvents.peerDisconnect, ({ streamId }) => {
      removeVideoStream(streamId);
    });

    return () => {
      unsubscribe();
      sendMessage(wsEvents.roomLeave, [id, myId]);
    };
  }, [id, myId, removeVideoStream, sendMessage, subscribe, userMediaStream]);

  // add my video stream
  useEffect(() => {
    if (!userMediaStream) return;

    addVideoStream(userMediaStream);
  }, [userMediaStream, addVideoStream]);

  // add user who already in room to me when I connect.
  useEffect(() => {
    if (!peer || !userMediaStream) return;

    peer.on(wsEvents.call, (call) => {
      call.answer(userMediaStream);

      call.on(wsEvents.stream, (userVideoStream) => {
        addVideoStream(userVideoStream);
      });
    });

    return () => {
      peer.off(wsEvents.call);
    };
  }, [addVideoStream, connectToNewUser, peer, peerId, userMediaStream]);

  // add new user when he connects to room
  useEffect(() => {
    if (!userMediaStream || !peer) return;

    const unsubscribe = subscribe(wsEvents.roomConnection, ({ streamId }) => {
      const connectCb = (userVideoStream: MediaStream) => {
        addVideoStream(userVideoStream);
      };

      connectToNewUser(streamId, userMediaStream, peer, connectCb);
    });

    return () => {
      unsubscribe();
    };
  }, [addVideoStream, connectToNewUser, peer, subscribe, userMediaStream]);

  return {
    streams,
    userMediaStream,
    addVideoStream,
    removeVideoStream,
  };
};
