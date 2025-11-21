import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import Draggable from "react-draggable";
import { useTranslation } from "react-i18next";

import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { MediaControls } from "@/components/MediaControls";
import { Shoot } from "@/components/Shoot";
import { VoteFlow } from "@/components/VoteFlow";
import { useMediaControls } from "@/hooks/useMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

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
    const { t } = useTranslation();
    const { usersStore, gamesStore, isIGM, myRole, isIWakedUp, isICanCheck } =
      rootStore;
    const { getUser, me, myId } = usersStore;
    const { isUserGM, gameFlow, activeGameId } = gamesStore;
    const { shoot = {}, killed = [], day, isStarted } = gameFlow;
    const containerRef = useRef<HTMLDivElement>(null);

    const userId = participant.identity;
    const currentUser = isMyStream ? me : getUser(userId);
    const isGM = isUserGM(userId);
    const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
    const isIDidShot = Object.values(shoot).some((shooters) =>
      shooters.includes(myId)
    );
    const isUserDead = killed.includes(userId);
    const isMyAfterStart = isMyStream && isStarted;
    const isShootEnabled =
      isIGM || (isIMafia && isIWakedUp && !isGM && day > 1 && !isIDidShot);

    const isCheckRoleEnabled =
      isIGM || (isICanCheck && !isMyStream && !isGM && !isUserDead);

    const {
      isCameraEnabled,
      isMicrophoneEnabled,
      toggleCamera,
      toggleMicrophone,
      canControl,
    } = useMediaControls({
      participant,
      isMyStream,
      isIGM,
      roomId: activeGameId || "",
      requesterId: myId,
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

          <CheckRole userId={userId} enabled={isCheckRoleEnabled} />

          {isShootEnabled && <Shoot userId={userId} />}

          {isUserDead && !isMyStream && (
            <div className={styles.deadOverlay}>{t("gameVideo.dead")}</div>
          )}

          {isIGM && !isMyStream && currentUser && (
            <VideoMenu userId={currentUser.id} isCurrentUserGM={isGM} />
          )}

          <PlayerVideo
            participant={participant}
            track={track}
            isActive={isActive}
            container={containerRef.current}
            muted={participant.isLocal}
          />

          <MediaControls
            isCameraEnabled={isCameraEnabled}
            isMicrophoneEnabled={isMicrophoneEnabled}
            onToggleCamera={toggleCamera}
            onToggleMicrophone={toggleMicrophone}
            canControl={canControl}
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
