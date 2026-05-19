import { useRoomContext } from "@livekit/components-react";
import { DisconnectReason, LocalVideoTrack, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef } from "react";

import { QualitySettings, QUALITY_PRESETS } from "@/config/video.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { setVideoRecoveryRepublish } from "@/helpers/videoRecoveryBridge.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";

const DEFAULT_ENCODING = QUALITY_PRESETS.high;
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 500;
const REPUBLISH_DEBOUNCE_MS = 500;
const VIDEO_HEALTH_CHECK_INTERVAL_MS = 30_000;

/**
 * Module-level flag that tracks whether the local user has **intentionally**
 * disabled their camera via the in-game toggle.
 *
 * Kept outside React to be readable by `republishAllTracks` without stale
 * closure issues, and writable from `useMediaControls` without prop-drilling.
 * Only ever applies to the local participant's own camera.
 */
let isLocalCameraIntentionallyMuted = false;

/** Called by `useMediaControls` whenever it processes a local camera toggle. */
export const setLocalCameraIntentionalMute = (muted: boolean): void => {
  isLocalCameraIntentionallyMuted = muted;
};

export const getLocalCameraIntentionallyMuted = (): boolean =>
  isLocalCameraIntentionallyMuted;

export const usePublishVideoTrack = (qualitySettings?: QualitySettings) => {
  const room = useRoomContext();
  const { socket } = useSocket();
  const pendingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Keep a reference to the last successfully published canvas so we can
  // republish it automatically after a LiveKit room reconnection.
  const lastPublishedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const retryCountRef = useRef<number>(0);
  const republishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      let localVideoTrack: LocalVideoTrack | undefined;

      try {
        const fps = qualitySettings?.fps ?? DEFAULT_ENCODING.fps;
        const maxBitrate = qualitySettings?.maxBitrate ?? DEFAULT_ENCODING.maxBitrate;

        // Check for an existing publication BEFORE allocating a new
        // captureStream — calling captureStream() creates a fresh
        // MediaStreamTrack that we'd otherwise leak on the early return below.
        const existingVideoTracks = Array.from(
          room.localParticipant.trackPublications.values()
        ).filter(
          (pub) =>
            pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera
        );

        const isNewCanvas = lastPublishedCanvasRef.current !== canvasElement;

        if (existingVideoTracks.length > 0 && !force && !isNewCanvas) {
          // A camera track is already published for this participant!
          // Since we are continuously drawing to the same `canvasElement` using
          // `requestAnimationFrame`, the original `MediaStreamTrack` we passed
          // to LiveKit perfectly reflects all visual updates.
          // Unpublishing and republishing here causes severe video dropouts for peers.
          return;
        }

        const videoStream = canvasElement.captureStream(fps);
        const [canvasVideoTrack] = videoStream.getVideoTracks();

        if (!canvasVideoTrack) {
          return;
        }

        localVideoTrack = new LocalVideoTrack(canvasVideoTrack);

        // If forcing (e.g. after reconnect) or canvas changed, unpublish stale tracks first
        if ((force || isNewCanvas) && existingVideoTracks.length > 0) {
          await Promise.all(
            existingVideoTracks.map(async (pub) => {
              if (pub.track) {
                pub.track.stop(); // Fix memory leak: Stop the old track to release captureStream resources
                await room.localParticipant.unpublishTrack(pub.track);
              }
            })
          );
        }

        await room.localParticipant.publishTrack(localVideoTrack, {
          source: Track.Source.Camera,
          videoEncoding: {
            maxBitrate,
            maxFramerate: fps,
          },
        });

        // Remember the canvas so we can republish after reconnection
        lastPublishedCanvasRef.current = canvasElement;
        localVideoTrack = undefined;
      } catch (error) {
        console.error(
          "[usePublishVideoTrack] Failed to publish video track:",
          error
        );
        // Fix memory leak: If publish fails, stop the track so we don't leak the captureStream
        localVideoTrack?.stop();
        localVideoTrack = undefined;
      }
    },
    [room]
  );

  /**
   * Checks whether local tracks are still healthy and republishes dead ones.
   * - Video: force-republishes the last known canvas when the track has ended.
   * - Microphone: toggles off/on via LiveKit participant API when the track has ended.
   *
   * This must NOT call room.disconnect() — only individual track republish to avoid
   * disturbing remote participants' subscriptions.
   */
  const republishAllTracks = useCallback(async () => {
    if (!room || room.state !== "connected") {
      console.warn("[LiveKit] Room not connected — skipping republish");
      return;
    }

    const { localParticipant } = room;

    // ── Video (canvas track) ────────────────────────────────────────────────
    const canvas = lastPublishedCanvasRef.current;
    if (canvas) {
      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      const cameraTrack = cameraPub?.track;
      // Case 1: no publication at all, or publication has no track object inside it
      const hasNoTrack = !cameraPub || !cameraTrack;
      // Case 2: track object exists but the underlying MediaStreamTrack has ended
      const isTrackDead = cameraTrack?.mediaStreamTrack?.readyState === "ended";

      if (hasNoTrack || isTrackDead) {
        console.log("[LiveKit] Video track dead or missing — force republishing canvas");
        void publishVideoTrack(canvas, true);
      } else if (cameraPub.isMuted && !isLocalCameraIntentionallyMuted) {
        // Case 3: track is alive but was unexpectedly muted by LiveKit (e.g. after
        // ICE restart). Only unmute when the user has NOT intentionally turned off
        // their camera via the in-game toggle.
        // For canvas streams we call track.unmute() — NOT setCameraEnabled() which
        // would try to open the physical browser camera and break the canvas pipeline.
        console.log("[LiveKit] Camera muted unexpectedly (track alive) — unmuting");
        try {
          await cameraTrack.unmute();
        } catch (err) {
          console.error("[LiveKit] Failed to unmute camera track:", err);
        }
      }
    }

    // ── Microphone ───────────────────────────────────────────────────────────
    const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micPub) {
      const micTrack = micPub.track;
      // Republish when there is no track object OR the underlying stream has ended
      const isMicTrackDeadOrMissing =
        !micTrack || micTrack.mediaStreamTrack?.readyState === "ended";

      if (isMicTrackDeadOrMissing) {
        console.log("[LiveKit] Microphone track ended or missing — republishing");
        try {
          await localParticipant.setMicrophoneEnabled(false);
          await localParticipant.setMicrophoneEnabled(true);
        } catch (err) {
          console.error("[LiveKit] Failed to republish microphone:", err);
        }
      }
    }
  }, [room, publishVideoTrack]);

  /** Debounced wrapper — prevents rapid-fire republish when multiple triggers fire at once */
  const debouncedRepublish = useCallback(() => {
    if (republishTimerRef.current) {
      clearTimeout(republishTimerRef.current);
    }

    republishTimerRef.current = setTimeout(() => {
      republishTimerRef.current = null;
      void republishAllTracks();
    }, REPUBLISH_DEBOUNCE_MS);
  }, [republishAllTracks]);

  useEffect(() => {
    setVideoRecoveryRepublish(debouncedRepublish);

    return () => {
      setVideoRecoveryRepublish(null);
    };
  }, [debouncedRepublish]);

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

    const handleRoomReconnecting = () => {
      console.log("[LiveKit] Room reconnecting — waiting for ICE restart...");
    };

    const handleRoomDisconnected = (reason?: DisconnectReason) => {
      console.warn("[LiveKit] Room disconnected:", reason);
    };

    room.on(RoomEvent.Connected, handleRoomConnected);
    room.on(RoomEvent.Reconnected, handleRoomReconnected);
    room.on(RoomEvent.Reconnecting, handleRoomReconnecting);
    room.on(RoomEvent.Disconnected, handleRoomDisconnected);

    if (room.state === "connected" && pendingCanvasRef.current) {
      void publishVideoTrack(pendingCanvasRef.current);
    }

    return () => {
      room.off(RoomEvent.Connected, handleRoomConnected);
      room.off(RoomEvent.Reconnected, handleRoomReconnected);
      room.off(RoomEvent.Reconnecting, handleRoomReconnecting);
      room.off(RoomEvent.Disconnected, handleRoomDisconnected);
    };
  }, [room, publishVideoTrack]);

  // ── videoRepublishRequired WS event ───────────────────────────────────────
  // BE emits this when it detects a socket reconnect within the grace period,
  // signalling that the player's video track may need to be republished.
  useEffect(() => {
    if (!socket) return;

    const handleVideoRepublishRequired = ({ reason }: { reason: string }) => {
      console.log(`[LiveKit] videoRepublishRequired received. Reason: ${reason}`);
      debouncedRepublish();
    };

    socket.on(wsEvents.videoRepublishRequired, handleVideoRepublishRequired);

    return () => {
      socket.off(wsEvents.videoRepublishRequired, handleVideoRepublishRequired);
    };
  }, [socket, debouncedRepublish]);

  // ── visibilitychange — mobile / tab background recovery ───────────────────
  // iOS/Android can revoke camera access when the tab is backgrounded.
  // When the user returns, check for dead tracks and republish.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[LiveKit] Tab became visible — checking tracks");
        debouncedRepublish();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [debouncedRepublish]);

  // ── Periodic self-heal health check (every 30s) ───────────────────────────
  // Catches silent track-ended states that no event fires for (e.g. browser
  // quietly killing the stream after a long background period).
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      const { localParticipant } = room;
      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      const isTrackDead = cameraPub?.track?.mediaStreamTrack?.readyState === "ended";

      if (isTrackDead) {
        console.log("[LiveKit] Self-heal: dead camera track detected");

        // Report to BE so it can log the event and potentially respond
        const { activeGameId } = rootStore.gamesStore;
        const { myId } = rootStore.usersStore;

        if (socket && activeGameId && myId) {
          socket.emit(wsEvents.healthCheck, { gameId: activeGameId, userId: myId, videoIssue: true });
        }

        debouncedRepublish();
      }
    }, VIDEO_HEALTH_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [room, socket, debouncedRepublish]);

  return { publishVideoTrack };
};
