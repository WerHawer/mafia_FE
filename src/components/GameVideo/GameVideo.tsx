import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./GameVideo.module.scss";
import classNames from "classnames";
import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import { UserId } from "../../types/user.types.ts";
import { usersStore } from "../../store/usersStore.ts";
import { PopupMenu, PopupMenuElement } from "../PopupMenu";
import { useUpdateGameGMMutation } from "../../api/game/queries.ts";
import { gamesStore } from "../../store/gamesStore.ts";

type GameVideoProps = {
  stream?: MediaStream;
  muted?: boolean;
  isMyStream?: boolean;
  isActive?: boolean;
  userId?: UserId;
};

const INDEX_RATIO = 0.75;

export const GameVideo = observer(
  ({
    stream,
    muted = false,
    isMyStream = false,
    isActive = false,
  }: GameVideoProps) => {
    const isMyStreamActive = isMyStream && stream;
    const [isWidthProportion, setIsWidthProportion] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { mutate: updateGM } = useUpdateGameGMMutation();
    const { userStreams, users } = usersStore;
    const { activeGameId, activeGameGm } = gamesStore;

    const currentUser = (() => {
      if (!stream) return;

      const streamsMap = new Map(userStreams);
      const userId = streamsMap.get(stream.id)?.userId;

      return userId ? users[userId] : undefined;
    })();

    const isCurrentUserGM = activeGameGm === currentUser?.id;

    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      const resize = throttle(() => {
        const { width, height } = container.getBoundingClientRect();
        setIsWidthProportion(height / width < INDEX_RATIO);
      }, 150);

      window.addEventListener("resize", resize);

      const timer = setTimeout(() => {
        resize();
      }, 100);

      return () => {
        window.removeEventListener("resize", resize);
        clearTimeout(timer);
      };
    }, [userStreams]);

    const handleUpdateGM = useCallback(() => {
      if (!currentUser || !activeGameId) return;

      if (isCurrentUserGM) return;

      updateGM({ gameId: activeGameId, userId: currentUser.id });
    }, [activeGameId, currentUser, isCurrentUserGM, updateGM]);

    return (
      <div
        className={classNames(styles.container, {
          [styles.myVideoContainer]: isMyStream,
          [styles.myVideoActive]: isMyStreamActive,
          [styles.active]: isActive,
        })}
        ref={containerRef}
      >
        {isCurrentUserGM ? (
          <h3 className={styles.gmLabel}>GM</h3>
        ) : (
          <PopupMenu
            content={
              <PopupMenuElement onClick={handleUpdateGM}>
                Do GM
              </PopupMenuElement>
            }
          >
            <div className={styles.menu}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </PopupMenu>
        )}
        {stream && (
          <video
            key={stream.id}
            className={classNames(
              styles.video,
              {
                [styles.active]: isActive,
              },
              isWidthProportion
                ? styles.widthProportion
                : styles.heightProportion,
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
        )}
        {currentUser && (
          <div className={styles.userInfo}>
            <div className={styles.userName}>{currentUser.name}</div>
          </div>
        )}
      </div>
    );
  },
);
