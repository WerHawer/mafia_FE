import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import styles from "./GameVideo.module.scss";
import { UserId } from "@/types/user.types.ts";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { PlayerVideo } from "../PlayerVideo";
import { VideoMenu } from "./VideoMenu.tsx";
import { VideoUserInfo } from "./VideoUserInfo.tsx";
import { StreamStatus } from "@/components/GameVideo/StreamStatus.tsx";
import { VoteIcon } from "@/UI/VoteIcon/VoteIcon.tsx";
import { ButtonSize } from "@/UI/Button/ButtonTypes.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";

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
    userId,
  }: GameVideoProps) => {
    const [isWidthProportion, setIsWidthProportion] = useState(false);
    const { myId, userStreamsMap, getUser, me } = usersStore;
    const { isUserGM, speaker, gameFlow, activeGameId } = gamesStore;
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const containerRef = useRef<HTMLDivElement>(null);

    const currentUser = isMyStream ? me : getUser(userId);
    const isMyStreamActive = isMyStream && stream;
    const isCurrentUserGM = isUserGM(userId);
    const isIGM = isUserGM(myId);
    const isISpeaker = speaker === myId;
    const isUserAddedToVoteList = userId
      ? gameFlow.proposed.includes(userId)
      : false;
    const shouldShowVoteIcon =
      !!speaker && (isISpeaker || isIGM) && !isMyStream && !isCurrentUserGM;

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
    }, [userStreamsMap, trigger, streamsLength, speaker, gameFlow.isStarted]);

    const handleVote = useCallback(() => {
      if ((myId !== speaker && !isUserGM(myId)) || !userId) return;

      const newList = isUserAddedToVoteList
        ? gameFlow.proposed.filter((id) => id !== userId)
        : [...gameFlow.proposed, userId];

      updateGameFlow({
        gameId: activeGameId,
        flow: { ...gameFlow, proposed: newList },
      });
    }, [
      activeGameId,
      gameFlow,
      isUserAddedToVoteList,
      isUserGM,
      myId,
      speaker,
      updateGameFlow,
      userId,
    ]);

    return (
      <Draggable
        disabled={!(isMyStream && gameFlow.isStarted)}
        defaultClassNameDragging={styles.dragging}
        position={!gameFlow.isStarted ? { x: 0, y: 0 } : undefined}
        nodeRef={containerRef}
      >
        <div
          className={classNames(styles.container, {
            [styles.myVideoContainer]: isMyStream && gameFlow.isStarted,
            [styles.myVideoActive]: isMyStreamActive,
            [styles.active]: isActive,
          })}
          ref={containerRef}
        >
          {shouldShowVoteIcon && (
            <VoteIcon
              className={styles.voteIcon}
              size={ButtonSize.Small}
              isVoted={isUserAddedToVoteList}
              onClick={handleVote}
            />
          )}

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
