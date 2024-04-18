import { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import styles from "./GameVideo.module.scss";
import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import { UserId } from "@/types/user.types.ts";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { PlayerVideo } from "../PlayerVideo";
import { VideoMenu } from "./VideoMenu.tsx";
import { VideoUserInfo } from "./VideoUserInfo.tsx";
import { StreamStatus } from "@/components/GameVideo/StreamStatus.tsx";

type GameVideoProps = {
  stream?: MediaStream;
  muted?: boolean;
  isMyStream?: boolean;
  isActive?: boolean;
  userId?: UserId;
  streamsLength?: number;
  trigger?: number;
  handleTrigger?: () => void;
};

const INDEX_RATIO = 0.75;

export const GameVideo = observer(
  ({
    stream,
    muted = false,
    isMyStream = false,
    isActive = false,
    trigger,
    handleTrigger,
    streamsLength,
  }: GameVideoProps) => {
    const [isWidthProportion, setIsWidthProportion] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { users, myId, userStreams } = usersStore;
    const { isUserGM, speaker, gameFlow } = gamesStore;

    const currentUser = useMemo(() => {
      if (!stream) return null;

      if (isMyStream) {
        return users[myId];
      }

      const userId =
        userStreams.find(([id]) => id === stream.id)?.[1].user.id ?? "";

      return users[userId];
    }, [isMyStream, myId, stream, userStreams, users]);

    const isMyStreamActive = isMyStream && stream;
    const isCurrentUserGM = isUserGM(currentUser?.id);
    const isIGM = isUserGM(myId);

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
    }, [userStreams, trigger, streamsLength, speaker, gameFlow.isStarted]);

    return (
      <Draggable
        disabled={!(isMyStream && gameFlow.isStarted)}
        defaultClassNameDragging={styles.dragging}
        position={!gameFlow.isStarted ? { x: 0, y: 0 } : undefined}
      >
        <div
          className={classNames(styles.container, {
            [styles.myVideoContainer]: isMyStream && gameFlow.isStarted,
            [styles.myVideoActive]: isMyStreamActive,
            [styles.active]: isActive,
          })}
          ref={containerRef}
        >
          {stream && (
            <StreamStatus
              stream={stream}
              isMyStream={isMyStream}
              isIGM={isIGM}
            />
          )}

          {isCurrentUserGM ? (
            <h3 className={styles.gmLabel}>GM</h3>
          ) : (
            <VideoMenu
              userId={currentUser?.id}
              isCurrentUserGM={isCurrentUserGM}
            />
          )}
          {stream && (
            <PlayerVideo
              stream={stream}
              muted={muted}
              isActive={isActive}
              isWidthProportion={isWidthProportion}
              onMount={handleTrigger}
            />
          )}
          {currentUser && (
            <VideoUserInfo
              userName={currentUser.name}
              userId={currentUser.id}
            />
          )}
        </div>
      </Draggable>
    );
  },
);

GameVideo.displayName = "GameVideo";
