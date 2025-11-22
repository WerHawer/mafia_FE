import classNames from "classnames";
import { Participant, Track } from "livekit-client";

import { useCalculateProportions } from "@/components/PlayerVideo/useCalculateProportions.ts";
import { useTrackConnection } from "@/components/PlayerVideo/useTrackConnetion.ts";
import { VideoPlaceholder } from "@/components/PlayerVideo/VideoPlaceholder.tsx";

import styles from "../GameVideo/GameVideo.module.scss";

type PlayerVideoProps = {
  participant: Participant;
  track?: Track;
  muted?: boolean;
  isActive: boolean;
  container?: HTMLDivElement | null;
  userName?: string;
  avatar?: string;
  isCameraEnabled?: boolean;
};

export const PlayerVideo = ({
  participant,
  track,
  muted = false,
  isActive,
  container,
  userName,
  avatar,
  isCameraEnabled = true,
}: PlayerVideoProps) => {
  const { videoRef, hasVideoTrack, audioRef } = useTrackConnection({
    track,
    participant,
    muted,
  });

  const isWidthProportion = useCalculateProportions(container);
  const shouldShowVideo = hasVideoTrack && isCameraEnabled;
  const shouldShowPlaceholder = !shouldShowVideo && userName;

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
          opacity: shouldShowVideo ? 1 : 0,
          pointerEvents: shouldShowVideo ? "auto" : "none",
        }}
      />

      {/* Audio element (separate from video) */}
      <audio
        ref={audioRef}
        autoPlay
        muted={muted}
        style={{ display: "none" }}
      />

      {/* Fallback when no video track or camera is disabled */}
      {shouldShowPlaceholder && (
        <VideoPlaceholder userName={userName} avatar={avatar} />
      )}
    </>
  );
};

PlayerVideo.displayName = "PlayerVideo";
