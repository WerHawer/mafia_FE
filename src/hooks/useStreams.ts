import Peer, { MediaConnection } from "peerjs";
import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUnmount } from "react-use";

import { streamStore } from "@/store/streamsStore.ts";

import { wsEvents } from "../config/wsEvents.ts";
import { usePeer } from "./usePeer.ts";
import { useSocket } from "./useSocket.ts";

const MAX_STREAMS = 11;

type UseStreamsParams = {
  myStream?: MediaStream;
  myId: string;
  activeGamePlayers: string[];
};

export const useStreams = ({
  myStream,
  myId,
  activeGamePlayers,
}: UseStreamsParams) => {
  const { id = "" } = useParams();
  const { subscribe, sendMessage } = useSocket();
  const { setStream, removeStream, resetStreams, streams, userStreamsMap } =
    streamStore;

  const { peer } = usePeer(myStream?.id);

  const connectToNewUser = useCallback(
    (
      otherUserId: string,
      stream: MediaStream,
      peer: Peer,
      cb: (userMediaStream: MediaStream) => void
    ) => {
      try {
        const call = peer.call(otherUserId, stream);

        call.on(wsEvents.stream, (userMediaStream) => {
          cb(userMediaStream);
        });

        call.on("error", (err) => {
          console.error(`Error in call to ${otherUserId}:`, err);
        });

        return call;
      } catch (error) {
        console.error(`Failed to connect to user ${otherUserId}:`, error);
        return null;
      }
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

  // add user who already in rooms to me when I connect.
  useEffect(() => {
    if (!peer || !myStream) return;

    // Keep track of connected calls
    const activeCalls = new Map();

    peer.on(wsEvents.call, (call) => {
      try {
        call.answer(myStream);

        // Store the call reference with its stream ID when it becomes available
        call.on(wsEvents.stream, (userVideoStream) => {
          activeCalls.set(userVideoStream.id, call);
          setStream(userVideoStream, MAX_STREAMS);
        });

        call.on("error", (err) => {
          console.error("Error in incoming call:", err);
        });
      } catch (error) {
        console.error("Failed to answer call:", error);
      }
    });

    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
    });

    return () => {
      // Clean up all active calls
      activeCalls.forEach((call) => {
        call.off(wsEvents.stream);
        call.off("error");
        call.close();
      });
      peer.off(wsEvents.call);
      peer.off("error");
    };
  }, [peer, setStream, myStream]);

  // add a new user when he connects to the room
  useEffect(() => {
    if (!myStream || !peer) return;

    const calls: MediaConnection[] = [];

    const unsubscribe = subscribe(wsEvents.roomConnection, ({ streamId }) => {
      const connectCb = (userVideoStream: MediaStream) => {
        setStream(userVideoStream, MAX_STREAMS);
      };

      const call = connectToNewUser(streamId, myStream, peer, connectCb);
      if (call) calls.push(call);
    });

    return () => {
      unsubscribe();
      // Clean up all call listeners to prevent memory leaks
      calls.forEach((call) => {
        call.off(wsEvents.stream);
        call.close();
      });
    };
  }, [connectToNewUser, peer, setStream, subscribe, myStream]);

  // Synchronize streams with active game players
  useEffect(() => {
    if (!myStream || !peer || !activeGamePlayers.length) return;

    // Get current player IDs from the streams
    const connectedPlayers = new Set();
    streams.forEach((stream) => {
      const streamInfo = userStreamsMap.get(stream.id);
      if (streamInfo?.user?.id) {
        connectedPlayers.add(streamInfo.user.id);
      }
    });

    // Find players that should be connected but aren't
    const missingPlayers = activeGamePlayers.filter(
      (playerId) => playerId !== myId && !connectedPlayers.has(playerId)
    );

    if (missingPlayers.length > 0) {
      console.log(
        `Found ${missingPlayers.length} missing player connections. Attempting to connect...`
      );

      // Try to directly connect to these players
      missingPlayers.forEach((playerId) => {
        if (peer && myStream) {
          try {
            // Re-use the existing mechanism to connect to a user
            const connectCb = (userVideoStream: MediaStream) => {
              setStream(userVideoStream, MAX_STREAMS);
            };

            // Try to connect to the player by ID
            connectToNewUser(playerId, myStream, peer, connectCb);
          } catch (error) {
            console.error(`Failed to connect to player ${playerId}:`, error);
          }
        }
      });
    }

    // Set up periodic check for stream-player synchronization
    const intervalId = setInterval(() => {
      const currentConnectedCount = streams.length;
      const expectedPlayerCount = activeGamePlayers.length;

      // If we're missing streams compared to players
      if (currentConnectedCount < expectedPlayerCount) {
        // Reuse the room connection event to trigger reconnections
        sendMessage(wsEvents.roomConnection, [id, myId, myStream.id]);
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    activeGamePlayers,
    myId,
    peer,
    myStream,
    streams,
    userStreamsMap,
    id,
    sendMessage,
    connectToNewUser,
    setStream,
  ]);

  useUnmount(() => {
    resetStreams();
  });
};
