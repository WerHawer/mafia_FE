import { VideoTrack } from "@livekit/components-react";
import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { memo } from "react";

import styles from "../GameVideo/GameVideo.module.scss";

type SimpleVideoPlayerProps = {
  participant: Participant;
  muted?: boolean;
  isActive?: boolean;
};

export const SimpleVideoPlayer = memo(
  ({ participant, muted = true, isActive = false }: SimpleVideoPlayerProps) => {
    // Отримуємо відеотрек учасника
    const videoTrackPublication = participant.getTrackPublication(
      Track.Source.Camera
    );
    const videoTrack = videoTrackPublication?.track;

    console.log("SimpleVideoPlayer:", {
      participant: participant.identity,
      hasPublication: !!videoTrackPublication,
      isSubscribed: videoTrackPublication?.isSubscribed,
      hasTrack: !!videoTrack,
    });

    return (
      <div className={styles.video}>
        {videoTrackPublication?.isSubscribed && videoTrack ? (
          <VideoTrack
            track={videoTrack}
            className={classNames(styles.video, {
              [styles.active]: isActive,
            })}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div className={classNames(styles.video, styles.noVideo)}>
            <div>
              {videoTrackPublication ? "Loading video..." : "No camera"}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SimpleVideoPlayer.displayName = "SimpleVideoPlayer";
