import { useCallback, useRef } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
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
};

export const GameVideo = observer(
  ({
    stream,
    muted = false,
    isMyStream = false,
    isActive = false,
    userId,
  }: GameVideoProps) => {
    const { myId, getUser, me } = usersStore;
    const { isUserGM, speaker, gameFlow, activeGameId } = gamesStore;
    const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
    const containerRef = useRef<HTMLDivElement>(null);

    // TODO: create a hook for this
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
              container={containerRef.current}
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
