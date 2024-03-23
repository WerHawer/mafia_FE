import styles from "./GameVideo.module.scss";
import classNames from "classnames";
import { memo } from "react";
import { Loader } from "../../UI/Loader";
import { LoaderDirection } from "../../UI/Loader/LoaderTypes.ts";

type GameVideoProps = {
  stream?: MediaStream;
  muted?: boolean;
  isMyStream?: boolean;
  isActive?: boolean;
};

export const GameVideo = memo(
  ({
    stream,
    muted = false,
    isMyStream = false,
    isActive = false,
  }: GameVideoProps) => {
    const isMyStreamActive = isMyStream && stream;

    return (
      <div
        className={classNames(styles.container, {
          [styles.myVideoContainer]: isMyStream,
          [styles.myVideoActive]: isMyStreamActive,
          [styles.active]: isActive,
        })}
      >
        {stream ? (
          <video
            key={stream.id}
            className={classNames(styles.video, {
              [styles.active]: isActive,
            })}
            playsInline
            autoPlay
            muted={muted}
            ref={(video) => {
              if (video) {
                video.srcObject = stream;
              }
            }}
          />
        ) : (
          <Loader
            i18nKey="waitingForPlayers"
            direction={LoaderDirection.Column}
          />
        )}
      </div>
    );
  },
);
