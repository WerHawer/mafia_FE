import { useParams } from "react-router-dom";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SocketContext, UserContext } from "../context/SocketProvider.tsx";
import { useUserMediaStream } from "./useUserMediaStream.ts";
import { usePeer } from "./usePeer.ts";
import Peer from "peerjs";
import { wsEvents } from "../config/wsEvents.ts";
import { v4 as uuid } from "uuid";

export type Stream = {
  id: string;
  stream?: MediaStream;
};

const INITIAL_STREAMS_COUNT = 10;
const INITIAL_STREAM = () =>
  ({
    id: uuid(),
  }) as Stream;

const initialStreams = new Array(INITIAL_STREAMS_COUNT)
  .fill(null)
  .map(INITIAL_STREAM);

export const useStreams = () => {
  const { id = "" } = useParams();
  const [streams, setStreams] = useState<Stream[]>(initialStreams);
  const user = useContext(UserContext);
  const socket = useContext(SocketContext);

  const sortedStreams = useMemo(() => {
    const streamsCopy = [...streams];

    streamsCopy.sort((a, b) => {
      if (a.stream) return -1;
      if (b.stream) return 1;

      return 0;
    });

    return streamsCopy;
  }, [streams]);

  const userMediaStream = useUserMediaStream(
    {
      audio: true,
      video: true,
    },
    !!user,
  );

  const { peer, peerId } = usePeer(userMediaStream?.id);

  const addVideoStream = useCallback((stream: MediaStream) => {
    setStreams((prev) => {
      const isStreamExist = prev.find((item) => item.id === stream.id);

      if (isStreamExist) return prev;

      const firstInitial = prev.find((item) => !item.stream);

      if (!firstInitial) return prev;

      return prev.map((item) =>
        item.id === firstInitial.id ? { id: stream.id, stream } : item,
      );
    });
  }, []);

  const removeVideoStream = useCallback((id: string) => {
    setStreams((prev) =>
      prev.map((item) => (item.id !== id ? item : INITIAL_STREAM())),
    );
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
    if (!peerId || !socket || !userMediaStream) return;

    socket.emit(wsEvents.roomConnection, id, peerId, userMediaStream.id);

    socket.on(wsEvents.peerDisconnect, (userId: string) => {
      removeVideoStream(userId);
    });
  }, [id, peerId, removeVideoStream, socket, userMediaStream]);

  // add my video stream
  useEffect(() => {
    if (!userMediaStream) return;

    addVideoStream(userMediaStream);
  }, [userMediaStream, addVideoStream]);

  // add user who already in room to me when I connect.
  useEffect(() => {
    if (!peer || !socket || !userMediaStream) return;

    peer.on(wsEvents.call, (call) => {
      call.answer(userMediaStream);

      call.on(wsEvents.stream, (userVideoStream) => {
        addVideoStream(userVideoStream);
      });
    });
  }, [addVideoStream, connectToNewUser, peer, peerId, socket, userMediaStream]);

  // add new user when he connects to room
  useEffect(() => {
    if (!socket || !userMediaStream || !peer) return;

    socket.on(wsEvents.roomConnection, (otherUserId) => {
      const connectCb = (userVideoStream: MediaStream) => {
        addVideoStream(userVideoStream);
      };

      connectToNewUser(otherUserId, userMediaStream, peer, connectCb);
    });
  }, [addVideoStream, connectToNewUser, peer, socket, userMediaStream]);

  return {
    streams: sortedStreams,
    userMediaStream,
    addVideoStream,
    removeVideoStream,
  };
};
