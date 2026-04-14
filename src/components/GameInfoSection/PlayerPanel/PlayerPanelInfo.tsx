import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Timer, TimerSize } from "@/components/SpeakerTimer/Timer.tsx";
import { rootStore } from "@/store/rootStore";
import { SoundEffect } from "@/store/soundStore.ts";
import { Typography } from "@/UI/Typography";

import styles from "./PlayerPanel.module.scss";

export const PlayerPanelInfo = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, soundStore, myRole } = rootStore;
  const { gameFlow, speaker } = gamesStore;
  const { stopMusic, playMusic } = soundStore;

  const { day, isNight, isVote, isReVote, speakTime, votesTime } = gameFlow;

  const dayNightLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;
  const roleLabel = t(`roles.${myRole}`);
  const hasSpeaker = Boolean(speaker);

  const time = isVote || isReVote ? votesTime : speakTime;
  const isVotingActive = isVote || isReVote;
  const timerTrigger = isVotingActive ? `${isVote}-${isReVote}` : speaker;
  const shouldShowTimer = hasSpeaker || isVotingActive;

  const onTimerStart = useCallback(() => {
    if (isVotingActive) {
      playMusic(SoundEffect.Ticking, true, 1.6);
    }
  }, [isVotingActive, playMusic]);

  const onVoteTimeUp = useCallback(() => {
    if (isVotingActive) {
      stopMusic();
    }
  }, [isVotingActive, stopMusic]);

  return (
    <div className={styles.infoContainer}>
      <div className={styles.dayNightSection}>
        <Typography variant="h3" className={styles.dayNightText}>
          {dayNightLabel}
        </Typography>
      </div>

      <div className={styles.roleSection}>
        <Typography variant="body" className={styles.roleLabel}>
          {t("game.role")}:
        </Typography>
        <Typography variant="body" className={styles.roleValue}>
          {roleLabel}
        </Typography>
      </div>

      {shouldShowTimer ? (
        <Timer
          resetTrigger={timerTrigger}
          time={time}
          size={TimerSize.Large}
          onTimerStart={isVotingActive ? onTimerStart : undefined}
          onTimeUp={isVotingActive ? onVoteTimeUp : undefined}
        />
      ) : null}
    </div>
  );
});

PlayerPanelInfo.displayName = "PlayerPanelInfo";
