import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  VideoPresets,
} from "livekit-client";
import { useCallback, useEffect, useState } from "react";

import { LIVEKIT_SERVER } from "../api/apiConstants.ts";

export const useLiveKit = (userId?: string, roomId?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(
    new Map()
  );
  const [localParticipant, setLocalParticipant] =
    useState<LocalParticipant | null>(null);

  const connectToRoom = useCallback(
    async (token: string) => {
      if (!userId || !roomId) return;

      try {
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });
        await room.prepareConnection(LIVEKIT_SERVER, token);

        // publish local camera and mic tracks
        await room.localParticipant.enableCameraAndMicrophone();

        // Set up event listeners
        room.on(RoomEvent.Connected, () => {
          setIsConnected(true);
          setLocalParticipant(room.localParticipant);
          setParticipants(
            (prev) => new Map(prev.set(userId, room.localParticipant))
          );
        });

        room.on(
          RoomEvent.ParticipantConnected,
          (participant: RemoteParticipant) => {
            setParticipants(
              (prev) => new Map(prev.set(participant.identity, participant))
            );
          }
        );

        room.on(
          RoomEvent.ParticipantDisconnected,
          (participant: RemoteParticipant) => {
            setParticipants((prev) => {
              const newMap = new Map(prev);
              newMap.delete(participant.identity);

              return newMap;
            });
          }
        );

        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setLocalParticipant(null);
          setParticipants(new Map());
        });

        // Connect to LiveKit server
        await room.connect(LIVEKIT_SERVER, token);

        setRoom(room);
      } catch (error) {
        console.error("Failed to connect to LiveKit room:", error);
      }
    },
    [userId, roomId]
  );

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setLocalParticipant(null);
      setParticipants(new Map());
    }
  }, [room]);

  useEffect(() => {
    return disconnect;
  }, [disconnect]);

  return {
    room,
    isConnected,
    participants,
    localParticipant,
    connectToRoom,
    disconnect,
  };
};
