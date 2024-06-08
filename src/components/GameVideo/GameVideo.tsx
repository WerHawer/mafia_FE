import React, { useEffect, useRef } from "react";
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
import { Roles, rolesWhoCanCheck } from "@/types/game.types.ts";
import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { rootStore } from "@/store/rootStore.ts";
import { Shoot } from "@/components/Shoot";

type GameVideoProps = {
  stream: MediaStream;
  muted?: boolean;
  isMyStream?: boolean;
  isActive?: boolean;
  userId?: UserId;
};

const DEFAULT_VIDEO_POSITION = { x: 0, y: 0 };

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
    const { getUser, me, myId } = usersStore;
    const { isUserGM, gameFlow } = gamesStore;
    const containerRef = useRef<HTMLDivElement>(null);

    // TODO: create a hook for this
    const currentUser = isMyStream ? me : getUser(userId);
    const isCurrentUserGM = isUserGM(userId);
    const canICheck = rolesWhoCanCheck.includes(myRole) && isIWakedUp;
    const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
    const isIDidShot = gameFlow.shoot.some(([shooterId]) => shooterId === myId);

    return (
      <Draggable
        disabled={!(isMyStream && gameFlow.isStarted)}
        defaultClassNameDragging={styles.dragging}
        position={!gameFlow.isStarted ? DEFAULT_VIDEO_POSITION : undefined}
        nodeRef={containerRef}
      >
        <div
          className={classNames(styles.container, {
            [styles.myVideoContainer]: isMyStream && gameFlow.isStarted,
            [styles.myVideoActive]: isMyStream,
            [styles.active]: isActive,
            [styles.gmOverlay]: isUserGM(userId),
          })}
          ref={containerRef}
        >
          <VoteFlow isMyStream={isMyStream} userId={userId} />

          <CheckRole
            userId={userId}
            enabled={
              isIWakedUp &&
              canICheck &&
              !isMyStream &&
              !isCurrentUserGM &&
              gameFlow.wakeUp.length === 1
            }
          />

          <Shoot
            userId={userId}
            enabled={
              isIGM ||
              (isIMafia &&
                isIWakedUp &&
                !isCurrentUserGM &&
                gameFlow.day > 1 &&
                !isIDidShot)
            }
          />

          {isIDead && isMyStream && (
            <div className={styles.deadOverlay}>Dead</div>
          )}

          <StreamStatus stream={stream} isMyStream={isMyStream} isIGM={isIGM} />

          {isCurrentUserGM ? (
            <h3 className={styles.gmLabel}>GM</h3>
          ) : (
            <VideoMenu
              userId={currentUser?.id}
              isCurrentUserGM={isCurrentUserGM}
            />
          )}

          <PlayerVideo
            stream={stream}
            muted={muted}
            isActive={isActive}
            container={containerRef.current}
          />

          {currentUser && (
            <VideoUserInfo
              userName={currentUser.nickName}
              userId={currentUser.id}
            />
          )}
        </div>
      </Draggable>
    );
  },
);

GameVideo.displayName = "GameVideo";
