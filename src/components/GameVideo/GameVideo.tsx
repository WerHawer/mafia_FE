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
import { useGameVideo } from "@/hooks/useGameVideo.ts";
import { rootStore } from "@/store/rootStore.ts";

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
    const { gamesStore } = rootStore;
    const { isUserGM } = gamesStore;
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      userId,
      currentUser,
      isGM,
      isUserDead,
      isMyAfterStart,
      isShootEnabled,
      isCheckRoleEnabled,
      isCameraEnabled,
      isMicrophoneEnabled,
      toggleCamera,
      toggleMicrophone,
      canControl,
      gameFlow,
    } = useGameVideo({ participant, isMyStream });

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

          {isCheckRoleEnabled ? <CheckRole userId={userId} /> : null}

          {isShootEnabled && <Shoot userId={userId} />}

          {isUserDead && !isMyStream && (
            <div className={styles.deadOverlay}>{t("gameVideo.dead")}</div>
          )}

          {rootStore.isIGM && !isMyStream && currentUser && (
            <VideoMenu userId={currentUser.id} isCurrentUserGM={isGM} />
          )}

          <PlayerVideo
            participant={participant}
            track={track}
            isActive={isActive}
            container={containerRef.current}
            muted={participant.isLocal}
            userName={currentUser?.nikName}
            avatar={currentUser?.avatar}
            isCameraEnabled={isCameraEnabled}
          />

          <MediaControls
            isCameraEnabled={isCameraEnabled}
            isMicrophoneEnabled={isMicrophoneEnabled}
            onToggleCamera={toggleCamera}
            onToggleMicrophone={toggleMicrophone}
            canControl={canControl}
            isMyAfterStart={isMyAfterStart}
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
