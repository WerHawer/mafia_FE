import classNames from "classnames";
import { Participant, Track } from "livekit-client";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { useTranslation } from "react-i18next";

import deadBg from "@/assets/images/dead_bg.avif";
import { CheckRole } from "@/components/CheckRole/CheckRole.tsx";
import { HealEffect } from "@/components/HealEffect";
import { InvestigateEffect } from "@/components/InvestigateEffect";
import { KissEffect } from "@/components/KissEffect";
import { MediaControls } from "@/components/MediaControls";
import { Shoot } from "@/components/Shoot";
import { VoteFlow } from "@/components/VoteFlow";
import { useGameVideo } from "@/hooks/useGameVideo.ts";
import { useIsSpeaking } from "@/hooks/useIsSpeaking.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
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
    const [investigatePos, setInvestigatePos] = useState<{ x: number; y: number } | null>(null);
    const [investigateResult, setInvestigateResult] = useState<string | null>(null);
    const [investigateDanger, setInvestigateDanger] = useState(false);
    // GM-only: peek at dead player's real video instead of the dead overlay
    const [showDeadVideo, setShowDeadVideo] = useState(false);
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
      isInvestigateEnabled,
      isCheckRoleEnabled,
      isCameraEnabled,
      isMicrophoneEnabled,
      toggleCamera,
      toggleMicrophone,
      canControl,
      gameFlow,
      shouldShowMafiaGlow,
      onShootUser,
      onBlockUser,
      onHealUser,
      onInvestigateUser,
    } = useGameVideo({ participant, isMyStream });

    const { soundStore } = rootStore;
    const isSpeaking = useIsSpeaking(participant);

    const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (isShootEnabled && !isIGM) {
        setLocalClickPos({ x, y });
        onShootUser(x, y);
        // Note: Sound is handled inside Shoot component for better sync with bullet animation
        return;
      }

      if (isKissEnabled) {
        setKissPos({ x, y });
        onBlockUser();
        soundStore.playSfx(SoundEffect.Kiss);
        return;
      }

      if (isHealEnabled) {
        setHealPos({ x, y });
        onHealUser();
        soundStore.playSfx(SoundEffect.Heal);
        return;
      }

      if (isInvestigateEnabled) {
        const res = onInvestigateUser();
        if (res) {
          setInvestigatePos({ x, y });
          setInvestigateResult(res.result);
          setInvestigateDanger(res.isDanger);
          soundStore.playSfx(SoundEffect.Check);
        }
      }
    };

    const isInteractive = (isShootEnabled && !isIGM) || isKissEnabled || isHealEnabled || isInvestigateEnabled;

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
            [styles.checkable]: isInvestigateEnabled,
            [styles.mafiaGlow]: shouldShowMafiaGlow,
          })}
          ref={containerRef}
          onClick={isInteractive ? handleVideoClick : undefined}
        >
          <VoteFlow isMyStream={isMyStream} userId={userId} />

          {isCheckRoleEnabled ? <CheckRole userId={userId} /> : null}

          <Shoot userId={userId} clickPosition={localClickPos} />
          <KissEffect userId={userId} clickPosition={kissPos} />
          <HealEffect userId={userId} clickPosition={healPos} />
          <InvestigateEffect
            clickPosition={investigatePos}
            result={investigateResult}
            isDanger={investigateDanger}
          />

          <div className={styles.gmIconContainer}>
            {isGM && <RoleIcon role={Roles.GM} size="l" />}
          </div>

          {isUserDead && (
            <div className={styles.statusLabelDead}>{t("gameVideo.dead")}</div>
          )}

          {isUserDead && !isMyStream && !showDeadVideo && (
            <div className={styles.deadOverlay} style={{ backgroundImage: `url(${deadBg})` }} />
          )}

          {isIGM && !isMyStream && currentUser && (
            <VideoMenu
              userId={currentUser.id}
              isCurrentUserGM={isGM}
              isUserDead={isUserDead}
              showDeadVideo={showDeadVideo}
              onToggleDeadVideo={() => setShowDeadVideo((prev) => !prev)}
            />
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

