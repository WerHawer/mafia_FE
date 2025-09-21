import { Participant, Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";

type UseTrackConnectionProps = {
  participant: Participant;
  track?: Track;
  muted: boolean;
};

export const useTrackConnection = ({
  participant,
  muted,
  track,
}: UseTrackConnectionProps) => {
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Use the passed track directly if available, otherwise fallback to participant publications
    const videoTrack =
      track || participant.getTrackPublication(Track.Source.Camera)?.track;
    const audioTrackPublication = participant.getTrackPublication(
      Track.Source.Microphone
    );
    const audioTrack = audioTrackPublication?.track;

    // Copy refs to variables to avoid React hooks warnings
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    // Cleanup function to detach previous tracks
    const cleanup = () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
      if (audioElement) {
        audioElement.srcObject = null;
      }
    };

    cleanup();

    // Attach video track - use the passed track or check subscription
    if (videoElement && videoTrack) {
      // If we have a track prop, use it directly
      // If we're using participant's track, check subscription
      const shouldAttach =
        track ||
        participant.getTrackPublication(Track.Source.Camera)?.isSubscribed;

      if (shouldAttach) {
        try {
          console.log(
            "PlayerVideo: Attempting to attach video track...",
            participant.identity,
            { trackSource: track ? "prop" : "participant" }
          );
          videoTrack.attach(videoElement);
          setHasVideoTrack(true);
          console.log("PlayerVideo: Video track attached successfully", {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            readyState: videoElement.readyState,
          });
        } catch (error) {
          console.error("PlayerVideo: Error attaching video track:", error);
          setHasVideoTrack(false);
        }
      } else {
        console.log("PlayerVideo: Video track not subscribed");
        setHasVideoTrack(false);
      }
    } else {
      console.log("PlayerVideo: Video track not available:", {
        hasVideoElement: !!videoElement,
        hasVideoTrack: !!videoTrack,
      });
      setHasVideoTrack(false);
    }

    // Attach audio track - skip if muted is true
    if (
      audioElement &&
      audioTrackPublication?.isSubscribed &&
      audioTrack &&
      !muted
    ) {
      try {
        audioTrack.attach(audioElement);
        console.log("PlayerVideo: Audio track attached successfully");
      } catch (error) {
        console.error("PlayerVideo: Error attaching audio track:", error);
      }
    } else if (muted) {
      console.log("PlayerVideo: Skipping audio attachment - muted is true");
    }

    // Cleanup on unmount or participant change
    return () => {
      try {
        if (videoTrack && videoElement) {
          console.log("PlayerVideo: Detaching video track");
          videoTrack.detach();
        }
        if (audioTrack && audioElement) {
          console.log("PlayerVideo: Detaching audio track");
          audioTrack.detach();
        }
      } catch (error) {
        console.error("PlayerVideo: Error during cleanup:", error);
      }
    };
  }, [participant, track, muted]);

  return { videoRef, audioRef, hasVideoTrack };
};
