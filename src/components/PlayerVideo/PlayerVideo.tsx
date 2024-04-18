import classNames from "classnames";
import styles from "../GameVideo/GameVideo.module.scss";
import { memo } from "react";

type PlayerVideoProps = {
  stream: MediaStream;
  muted: boolean;
  isActive: boolean;
  isWidthProportion: boolean;
  onMount?: () => void;
};

export const PlayerVideo = memo(
  ({
    stream,
    muted,
    isWidthProportion,
    isActive,
    onMount,
  }: PlayerVideoProps) => {
    return (
      <video
        className={classNames(
          styles.video,
          {
            [styles.active]: isActive,
          },
          isWidthProportion ? styles.widthProportion : styles.heightProportion,
        )}
        playsInline
        autoPlay
        muted={muted}
        ref={(video) => {
          if (video) {
            video.srcObject = stream;
            onMount?.();
          }
        }}
      />
    );
  },
);

PlayerVideo.displayName = "PlayerVideo";
