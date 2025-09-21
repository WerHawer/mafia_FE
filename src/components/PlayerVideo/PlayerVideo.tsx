import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { throttle } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "../GameVideo/GameVideo.module.scss";

type PlayerVideoProps = {
  participant: Participant;
  track?: Track;
  muted?: boolean;
  isActive: boolean;
  container?: HTMLDivElement | null;
};

const INDEX_RATIO = 0.57;

export const PlayerVideo = ({
  participant,
  track,
  muted = false,
  isActive,
  container,
}: PlayerVideoProps) => {
  const [isWidthProportion, setIsWidthProportion] = useState(false);
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

  const getSizeDirection = useCallback(() => {
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    setIsWidthProportion(height / width < INDEX_RATIO);
  }, [container]);

  useEffect(() => {
    if (!container) return;

    getSizeDirection(); // Initial call

    const throttledResize = throttle(getSizeDirection, 150);
    const resizeObserver = new ResizeObserver(throttledResize);

    resizeObserver.observe(container);

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, [container, getSizeDirection]);

  return (
    <>
      {/* Video element */}
      <video
        className={classNames(
          styles.video,
          {
            [styles.active]: isActive,
          },
          isWidthProportion ? styles.widthProportion : styles.heightProportion
        )}
        playsInline
        autoPlay
        muted={muted}
        ref={videoRef}
        style={{
          display: hasVideoTrack ? "block" : "none",
        }}
      />

      {/* Audio element (separate from video) */}
      <audio
        ref={audioRef}
        autoPlay
        muted={muted}
        style={{ display: "none" }}
      />

      {/* Fallback when no video track */}
      {!hasVideoTrack ? (
        <div className={classNames(styles.video, styles.noVideo)}>
          <div>No Video</div>
        </div>
      ) : null}
    </>
  );
};

PlayerVideo.displayName = "PlayerVideo";
