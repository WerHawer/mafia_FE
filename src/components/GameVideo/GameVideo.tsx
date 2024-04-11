import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./GameVideo.module.scss";
import classNames from "classnames";
import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import { UserId } from "../../types/user.types.ts";
import { usersStore } from "../../store/usersStore.ts";
import { PopupMenu, PopupMenuElement } from "../PopupMenu";
import { useUpdateGameGMMutation } from "../../api/game/queries.ts";
import { gamesStore } from "../../store/gamesStore.ts";
import { PlayerVideo } from "../PlayerVideo";

type GameVideoProps = {
  stream?: MediaStream;
  muted?: boolean;
  isMyStream?: boolean;
  isActive?: boolean;
  userId?: UserId;
  streamsLength?: number;
};

const INDEX_RATIO = 0.75;

export const GameVideo = observer(
  ({
    stream,
    muted = false,
    isMyStream = false,
    isActive = false,
    streamsLength,
  }: GameVideoProps) => {
    const isMyStreamActive = isMyStream && stream;
    const [isWidthProportion, setIsWidthProportion] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { mutate: updateGM } = useUpdateGameGMMutation();
    const { userStreams, users } = usersStore;
    const { activeGameId, activeGameGm } = gamesStore;

    const currentUser = useMemo(() => {
      if (!stream) return;

      const userId =
        userStreams.find(([id]) => id === stream.id)?.[1].userId ?? "";

      return users[userId];
    }, [stream, userStreams, users]);

    const isCurrentUserGM = activeGameGm === currentUser?.id;

    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      const resize = throttle(() => {
        const { width, height } = container.getBoundingClientRect();
        setIsWidthProportion(height / width < INDEX_RATIO);
      }, 150);

      window.addEventListener("resize", resize);

      resize();

      return () => {
        window.removeEventListener("resize", resize);
      };
    }, [userStreams, streamsLength]);

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
          <PlayerVideo
            stream={stream}
            muted={muted}
            isActive={isActive}
            isWidthProportion={isWidthProportion}
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
