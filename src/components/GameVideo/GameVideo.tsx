import styles from "./GameVideo.module.scss";
import { PuffLoader } from "react-spinners";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import { memo } from "react";

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
    const { t } = useTranslation();
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
          <div className={styles.loaderContainer}>
            <PuffLoader size={50} color="#8B949E" speedMultiplier={0.75} />
            <span>{t("waitingForPlayers")}</span>
          </div>
        )}
      </div>
    );
  },
);
