import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { useTranslation } from "react-i18next";

import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { HealEffect } from "@/components/HealEffect";
import { KissEffect } from "@/components/KissEffect";
import { MediaControls } from "@/components/MediaControls";
import { Shoot } from "@/components/Shoot";
import { VoteFlow } from "@/components/VoteFlow";
import { useGameVideo } from "@/hooks/useGameVideo.ts";
import { useIsSpeaking } from "@/hooks/useIsSpeaking.ts";
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
    const [localClickPos, setLocalClickPos] = useState<{ x: number; y: number } | null>(null);
    const [kissPos, setKissPos] = useState<{ x: number; y: number } | null>(null);
    const [healPos, setHealPos] = useState<{ x: number; y: number } | null>(null);

    const {
      userId,
      currentUser,
      isGM,
      isIGM,
      isUserDead,
      isMyAfterStart,
      isShootEnabled,
      isKissEnabled,
      isHealEnabled,
      isCheckRoleEnabled,
      isCameraEnabled,
      isMicrophoneEnabled,
      toggleCamera,
      toggleMicrophone,
      canControl,
      gameFlow,
      onShootUser,
      onBlockUser,
      onHealUser,
    } = useGameVideo({ participant, isMyStream });

    const isSpeaking = useIsSpeaking(participant);

    const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (isShootEnabled && !isIGM) {
        setLocalClickPos({ x, y });
        onShootUser(x, y);
        return;
      }

      if (isKissEnabled) {
        setKissPos({ x, y });
        onBlockUser();
        return;
      }

      if (isHealEnabled) {
        setHealPos({ x, y });
        onHealUser();
      }
    };

    const isInteractive = (isShootEnabled && !isIGM) || isKissEnabled || isHealEnabled;

    return (
      <Draggable
        disabled={!isMyAfterStart || isActive}
        defaultClassNameDragging={styles.dragging}
        position={!gameFlow.isStarted ? DEFAULT_VIDEO_POSITION : undefined}
        nodeRef={containerRef}
      >
        <div
          className={classNames("videoContainer", styles.container, {
            [styles.myVideoContainer]: isMyAfterStart,
            [styles.active]: isActive,
            [styles.speaking]: isSpeaking && !isMyStream,
            [styles.shootable]: isShootEnabled && !isIGM,
            [styles.kissable]: isKissEnabled,
            [styles.healable]: isHealEnabled,
          })}
          ref={containerRef}
          onClick={isInteractive ? handleVideoClick : undefined}
        >
          <VoteFlow isMyStream={isMyStream} userId={userId} />

          {isCheckRoleEnabled ? <CheckRole userId={userId} /> : null}

          <Shoot userId={userId} clickPosition={localClickPos} />
          <KissEffect userId={userId} clickPosition={kissPos} />
          <HealEffect userId={userId} clickPosition={healPos} />

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

