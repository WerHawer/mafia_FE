import { useRoomContext } from "@livekit/components-react";
import { isKrispNoiseFilterSupported, KrispNoiseFilter, type KrispNoiseFilterProcessor } from "@livekit/krisp-noise-filter";
import { LocalAudioTrack, LocalTrackPublication, ParticipantEvent, Track } from "livekit-client";
import { useEffect } from "react";

/**
 * Applies Krisp AI noise cancellation to the local microphone track.
 * Runs entirely in the browser via WebAssembly — no extra server cost.
 * Must be rendered inside <LiveKitRoom> to access room context.
 */
export const KrispNoiseProcessor = () => {
  useEffect(() => {
    // Krisp AI noise cancellation is a proprietary feature exclusive to LiveKit Cloud.
    // Since we migrated to a self-hosted server, it will return a 404 error trying to fetch settings.
    // The browser's native WebRTC noise suppression (which is quite good) is enabled automatically
    // by LiveKit when publishing microphone tracks, so we just return early.
    // console.log("[Krisp] Disabled on self-hosted server. Native noise suppression is active.");
  }, []);

  return null;
};

KrispNoiseProcessor.displayName = "KrispNoiseProcessor";
