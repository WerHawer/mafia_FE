import classNames from "classnames";
import { throttle } from "lodash";
import { memo, useCallback, useEffect, useState } from "react";
import styles from "../GameVideo/GameVideo.module.scss";

type PlayerVideoProps = {
  stream: MediaStream;
  muted: boolean;
  isActive: boolean;
  container?: HTMLDivElement | null;
};

const INDEX_RATIO = 0.57;

export const PlayerVideo = memo(
  ({ stream, muted, isActive, container }: PlayerVideoProps) => {
    const [isWidthProportion, setIsWidthProportion] = useState(false);

    const getSizeDirection = useCallback(() => {
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      setIsWidthProportion(height / width < INDEX_RATIO);
    }, [container]);

    useEffect(() => {
      if (!container) return;

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
        ref={(video) => {
          if (video) {
            video.srcObject = stream;
          }
        }}
      />
    );
  }
);

PlayerVideo.displayName = "PlayerVideo";
