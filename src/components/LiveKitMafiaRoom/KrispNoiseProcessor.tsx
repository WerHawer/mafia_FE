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
  const room = useRoomContext();

  useEffect(() => {
    if (!isKrispNoiseFilterSupported()) {
      console.warn("[Krisp] Noise filter not supported in this browser");

      return;
    }

    const krispFilter: KrispNoiseFilterProcessor = KrispNoiseFilter();

    const applyFilter = async (publication: LocalTrackPublication) => {
      if (publication.source !== Track.Source.Microphone) return;

      const track = publication.track;

      if (!(track instanceof LocalAudioTrack)) return;

      try {
        await track.setProcessor(krispFilter);
        console.log("[Krisp] Noise filter applied to microphone track");
      } catch (error) {
        console.error("[Krisp] Failed to apply noise filter:", error);
      }
    };

    // Apply to microphone track if it is already published (e.g. room reconnect)
    const existingMic = room.localParticipant.getTrackPublication(Track.Source.Microphone);

    if (existingMic) {
      void applyFilter(existingMic as LocalTrackPublication);
    }

    // Re-apply whenever the mic track is (re)published — e.g. after being toggled off/on
    room.localParticipant.on(ParticipantEvent.LocalTrackPublished, applyFilter);

    return () => {
      room.localParticipant.off(ParticipantEvent.LocalTrackPublished, applyFilter);

      // Stop processor and release WASM resources
      const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const micTrack = micPub?.track;

      if (micTrack instanceof LocalAudioTrack) {
        void micTrack.stopProcessor();
      }

      void krispFilter.destroy();
    };
  }, [room]);

  return null;
};

KrispNoiseProcessor.displayName = "KrispNoiseProcessor";
