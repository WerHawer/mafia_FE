import { streamStore } from "@/store/streamsStore.ts";
import Peer from "peerjs";
import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUnmount } from "react-use";
import { wsEvents } from "../config/wsEvents.ts";
import { usePeer } from "./usePeer.ts";
import { useSocket } from "./useSocket.ts";

const MAX_STREAMS = 11;

type UseStreamsParams = {
  myStream?: MediaStream;
  myId: string;
};

export const useStreams = ({ myStream, myId }: UseStreamsParams) => {
  const { id = "" } = useParams();
  const { subscribe, sendMessage } = useSocket();
  const { setStream, removeStream, resetStreams } = streamStore;

  const { peer, peerId } = usePeer(myStream?.id);

  const connectToNewUser = useCallback(
    (
      otherUserId: string,
      stream: MediaStream,
      peer: Peer,
      cb: (userMediaStream: MediaStream) => void
    ) => {
      const call = peer.call(otherUserId, stream);

      call.on(wsEvents.stream, (userMediaStream) => {
        cb(userMediaStream);
      });

      return call;
    },
    []
  );

  useEffect(() => {
    if (!myStream || !myId) return;

    sendMessage(wsEvents.roomConnection, [id, myId, myStream.id]);

    const unsubscribe = subscribe(wsEvents.peerDisconnect, ({ streamId }) => {
      removeStream(streamId);
    });

    return () => {
      unsubscribe();
      sendMessage(wsEvents.roomLeave, [id, myId]);
    };
  }, [id, myId, removeStream, sendMessage, subscribe, myStream]);

  // add my video stream
  useEffect(() => {
    if (!myStream) return;

    setStream(myStream, MAX_STREAMS);
  }, [myStream, setStream]);

  // add user who already in room to me when I connect.
  useEffect(() => {
    if (!peer || !myStream) return;

    peer.on(wsEvents.call, (call) => {
      call.answer(myStream);

      call.on(wsEvents.stream, (userVideoStream) => {
        setStream(userVideoStream, MAX_STREAMS);
      });
    });

    return () => {
      peer.off(wsEvents.call);
    };
  }, [connectToNewUser, peer, peerId, setStream, myStream]);

  // add new user when he connects to room
  useEffect(() => {
    if (!myStream || !peer) return;

    const unsubscribe = subscribe(wsEvents.roomConnection, ({ streamId }) => {
      const connectCb = (userVideoStream: MediaStream) => {
        setStream(userVideoStream, MAX_STREAMS);
      };

      connectToNewUser(streamId, myStream, peer, connectCb);
    });

    return () => {
      unsubscribe();
    };
  }, [connectToNewUser, peer, setStream, subscribe, myStream]);

  useUnmount(() => {
    resetStreams();
  });
};
