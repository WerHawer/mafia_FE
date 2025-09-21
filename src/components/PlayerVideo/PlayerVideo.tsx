import classNames from "classnames";
import { Participant, Track } from "livekit-client";

import { useCalculateProportions } from "@/components/PlayerVideo/useCalculateProportions.ts";
import { useTrackConnection } from "@/components/PlayerVideo/useTrackConnetion.ts";

import styles from "../GameVideo/GameVideo.module.scss";

type PlayerVideoProps = {
  participant: Participant;
  track?: Track;
  muted?: boolean;
  isActive: boolean;
  container?: HTMLDivElement | null;
};

export const PlayerVideo = ({
  participant,
  track,
  muted = false,
  isActive,
  container,
}: PlayerVideoProps) => {
  const { videoRef, hasVideoTrack, audioRef } = useTrackConnection({
    track,
    participant,
    muted,
  });

  const isWidthProportion = useCalculateProportions(container);

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
