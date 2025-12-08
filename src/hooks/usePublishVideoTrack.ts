import { useRoomContext } from "@livekit/components-react";
import { LocalVideoTrack, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef } from "react";

const FPS = 30;
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 500;

export const usePublishVideoTrack = () => {
  const room = useRoomContext();
  const pendingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const retryCountRef = useRef<number>(0);

  const publishVideoTrack = useCallback(
    async (canvasElement: HTMLCanvasElement) => {
      if (!room || !canvasElement) {
        return;
      }

      if (room.state !== "connected") {
        pendingCanvasRef.current = canvasElement;

        if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          retryCountRef.current++;
          const delay = RETRY_DELAY_MS * retryCountRef.current;

          setTimeout(() => {
            if (pendingCanvasRef.current) {
              void publishVideoTrack(pendingCanvasRef.current);
            }
          }, delay);
        }

        return;
      }

      retryCountRef.current = 0;
      pendingCanvasRef.current = null;

      try {
        const videoStream = canvasElement.captureStream(FPS);
        const [canvasVideoTrack] = videoStream.getVideoTracks();

        if (!canvasVideoTrack) {
          return;
        }

        const localVideoTrack = new LocalVideoTrack(canvasVideoTrack);

        const existingVideoTracks = Array.from(
          room.localParticipant.trackPublications.values()
        ).filter((pub) => pub.kind === Track.Kind.Video);

        if (existingVideoTracks.length > 0) {
          const unpublishPromises = existingVideoTracks.map(
            async (publication) => {
              if (publication.track) {
                await room.localParticipant.unpublishTrack(publication.track);
              }
            }
          );

          await Promise.all(unpublishPromises);
        }

        await room.localParticipant.publishTrack(localVideoTrack, {
          source: Track.Source.Camera,
        });
      } catch (error) {
        console.error(
          "[usePublishVideoTrack] Failed to publish video track:",
          error
        );
      }
    },
    [room]
  );

  useEffect(() => {
    if (!room) return;

    const handleRoomConnected = () => {
      if (pendingCanvasRef.current) {
        retryCountRef.current = 0;
        void publishVideoTrack(pendingCanvasRef.current);
      }
    };

    room.on(RoomEvent.Connected, handleRoomConnected);

    if (room.state === "connected" && pendingCanvasRef.current) {
      void publishVideoTrack(pendingCanvasRef.current);
    }

    return () => {
      room.off(RoomEvent.Connected, handleRoomConnected);
    };
  }, [room, publishVideoTrack]);

  return { publishVideoTrack };
};
