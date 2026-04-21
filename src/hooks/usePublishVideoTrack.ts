import { useRoomContext } from "@livekit/components-react";
import { LocalVideoTrack, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef } from "react";

const FPS = 30;
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 500;

export const usePublishVideoTrack = () => {
  const room = useRoomContext();
  const pendingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Keep a reference to the last successfully published canvas so we can
  // republish it automatically after a LiveKit room reconnection.
  const lastPublishedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const retryCountRef = useRef<number>(0);

  const publishVideoTrack = useCallback(
    async (canvasElement: HTMLCanvasElement, force = false) => {
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
        ).filter(
          (pub) =>
            pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera
        );

        if (existingVideoTracks.length > 0 && !force) {
          // A camera track is already published for this participant!
          // Since we are continuously drawing to the same `canvasElement` using
          // `requestAnimationFrame`, the original `MediaStreamTrack` we passed
          // to LiveKit perfectly reflects all visual updates.
          // Unpublishing and republishing here causes severe video dropouts for peers.
          return;
        }

        // If forcing (e.g. after reconnect), unpublish stale tracks first
        if (force && existingVideoTracks.length > 0) {
          await Promise.all(
            existingVideoTracks.map(async (pub) => {
              if (pub.track) {
                await room.localParticipant.unpublishTrack(pub.track);
              }
            })
          );
        }

        await room.localParticipant.publishTrack(localVideoTrack, {
          source: Track.Source.Camera,
        });

        // Remember the canvas so we can republish after reconnection
        lastPublishedCanvasRef.current = canvasElement;
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
      const canvas = pendingCanvasRef.current || lastPublishedCanvasRef.current;
      if (canvas) {
        retryCountRef.current = 0;
        void publishVideoTrack(canvas);
      }
    };

    // After a WebRTC reconnect, LiveKit clears local track publications on the server side.
    // We MUST republish the canvas track so remote peers can see us again.
    const handleRoomReconnected = () => {
      const canvas =
        lastPublishedCanvasRef.current || pendingCanvasRef.current;
      console.log(
        "[usePublishVideoTrack] Room reconnected — republishing canvas track"
      );
      if (canvas) {
        retryCountRef.current = 0;
        // force=true: clean up any stale publications and publish fresh
        void publishVideoTrack(canvas, true);
      }
    };

    room.on(RoomEvent.Connected, handleRoomConnected);
    room.on(RoomEvent.Reconnected, handleRoomReconnected);

    if (room.state === "connected" && pendingCanvasRef.current) {
      void publishVideoTrack(pendingCanvasRef.current);
    }

    return () => {
      room.off(RoomEvent.Connected, handleRoomConnected);
      room.off(RoomEvent.Reconnected, handleRoomReconnected);
    };
  }, [room, publishVideoTrack]);

  return { publishVideoTrack };
};
