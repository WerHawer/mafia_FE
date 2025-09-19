import { VideoTrack } from "@livekit/components-react";
import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import Draggable from "react-draggable";

import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { Shoot } from "@/components/Shoot";
import { VoteFlow } from "@/components/VoteFlow";
import { rootStore } from "@/store/rootStore.ts";
import { Roles, rolesWhoCanCheck } from "@/types/game.types.ts";

import { PlayerVideo } from "../PlayerVideo";
import styles from "./GameVideo.module.scss";
import { VideoMenu } from "./VideoMenu.tsx";
import { VideoUserInfo } from "./VideoUserInfo.tsx";

type GameVideoProps = {
  participant: Participant;
  track?: Track;
  isMyStream: boolean;
  isActive?: boolean;
};

const DEFAULT_VIDEO_POSITION = { x: 0, y: 0 };

export const GameVideo = observer(
  ({
    participant,
    track,
    isMyStream = false,
    isActive = false,
  }: GameVideoProps) => {
    const { usersStore, gamesStore, isIGM, isIDead, myRole, isIWakedUp } =
      rootStore;
    const { getUser, me, myId } = usersStore;
    const { isUserGM, gameFlow } = gamesStore;
    const containerRef = useRef<HTMLDivElement>(null);

    const userId = participant.identity;
    const currentUser = isMyStream ? me : getUser(userId);
    const isCurrentUserGM = isUserGM(userId);
    const canICheck = rolesWhoCanCheck.includes(myRole) && isIWakedUp;
    const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
    const isIDidShot = gameFlow.shoot.some(([shooterId]) => shooterId === myId);
    const isMyAfterStart = isMyStream && gameFlow.isStarted;

    // Debug logging
    console.log("GameVideo render:", {
      userId,
      isMyStream,
      hasTrack: !!track,
      participantTracks: participant.getTrackPublications().length,
    });

    return (
      <Draggable
        disabled={!isMyAfterStart}
        defaultClassNameDragging={styles.dragging}
        position={!gameFlow.isStarted ? DEFAULT_VIDEO_POSITION : undefined}
        nodeRef={containerRef}
      >
        <div
          className={classNames("videoContainer", styles.container, {
            [styles.myVideoContainer]: isMyAfterStart,
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

          {isIGM && !isMyStream && currentUser && (
            <VideoMenu
              userId={currentUser.id}
              isCurrentUserGM={isCurrentUserGM}
            />
          )}

          <PlayerVideo
            participant={participant}
            track={track}
            muted
            isActive={isActive}
            container={containerRef.current}
          />

          {currentUser && (
            <VideoUserInfo
              userName={currentUser.nikName}
              userId={currentUser.id}
            />
          )}
        </div>
      </Draggable>
    );
  }
);

GameVideo.displayName = "GameVideo";
