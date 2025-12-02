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
import { useIsSpeaking } from "@/hooks/useIsSpeaking.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { RoleIcon } from "@/UI/RoleIcon";

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
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      userId,
      currentUser,
      isGM,
      isIGM,
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

    const isSpeaking = useIsSpeaking(participant);

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
            [styles.speaking]: isSpeaking && !isMyStream,
          })}
          ref={containerRef}
        >
          <VoteFlow isMyStream={isMyStream} userId={userId} />

          {isCheckRoleEnabled ? <CheckRole userId={userId} /> : null}

          {isShootEnabled && <Shoot userId={userId} />}

          <div className={styles.gmIconContainer}>
            {isGM && <RoleIcon role={Roles.GM} size="l" />}
          </div>

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
            userName={currentUser?.nikName}
            avatar={currentUser?.avatar}
            isCameraEnabled={isCameraEnabled}
            isSpeaking={isSpeaking && !isMyStream}
          />

          <MediaControls
            isCameraEnabled={isCameraEnabled}
            isMicrophoneEnabled={isMicrophoneEnabled}
            onToggleCamera={toggleCamera}
            onToggleMicrophone={toggleMicrophone}
            canControl={canControl}
            isMyAfterStart={isMyAfterStart}
            isIGM={isIGM}
            isMyStream={isMyStream}
            isSpeaking={isSpeaking && !isMyStream}
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
