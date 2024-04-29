import React, { useRef } from "react";
import classNames from "classnames";
import Draggable from "react-draggable";
import { observer } from "mobx-react-lite";
import styles from "./GameVideo.module.scss";
import { UserId } from "@/types/user.types.ts";
import { PlayerVideo } from "../PlayerVideo";
import { VideoMenu } from "./VideoMenu.tsx";
import { VideoUserInfo } from "./VideoUserInfo.tsx";
import { StreamStatus } from "@/components/GameVideo/StreamStatus.tsx";
import { VoteFlow } from "@/components/VoteFlow";
import { rolesWhoCanCheck } from "@/types/game.types.ts";
import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { rootStore } from "@/store/rootStore.ts";

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
    userId = "",
  }: GameVideoProps) => {
    const { usersStore, gamesStore, isIGM, isIDead, myRole, isIWakedUp } =
      rootStore;
    const { myId, getUser, me } = usersStore;
    const { isUserGM, gameFlow, getUserRole } = gamesStore;
    const containerRef = useRef<HTMLDivElement>(null);

    // TODO: create a hook for this
    const currentUser = isMyStream ? me : getUser(userId);
    const isMyStreamActive = isMyStream && stream;
    const isCurrentUserGM = isUserGM(userId);
    const canICheck = rolesWhoCanCheck.includes(myRole) && isIWakedUp;

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
            [styles.gmOverlay]: isUserGM(userId),
          })}
          ref={containerRef}
        >
          <VoteFlow isMyStream={isMyStream} userId={userId} />

          <CheckRole
            userId={userId}
            enabled={isIWakedUp && canICheck && !isMyStream && !isCurrentUserGM}
          />

          {isIDead && isMyStream && (
            <div className={styles.deadOverlay}>Dead</div>
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
