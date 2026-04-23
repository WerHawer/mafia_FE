import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { Timer, TimerSize } from "@/components/SpeakerTimer/Timer.tsx";
import { useGamePanel } from "@/hooks/useGamePanel.ts";
import { rootStore } from "@/store/rootStore";
import { SoundEffect } from "@/store/soundStore.ts";
import { Switcher } from "@/UI/Switcher";
import { Typography } from "@/UI/Typography";

import { DayPanel } from "./DayPanel";
import styles from "./GmPanel.module.scss";

export const GamePanel = observer(() => {
  const { t } = useTranslation();
  const { gameFlow, onNightDaySwitch } = useGamePanel();
  const { gamesStore, soundStore } = rootStore;
  const { speaker } = gamesStore;
  const { stopMusic, playMusic } = soundStore;
  const { isNight, day, isVote, isReVote, votesTime } = gameFlow;

  const phaseLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;

  const isVotingActive = isVote || isReVote;
  const shouldShowTimer = isVotingActive;
  const timerValue = votesTime;
  const timerTrigger = `${isVote}-${isReVote}`;

  const onTimerStart = useCallback(() => {
    if (isVotingActive) {
      playMusic(SoundEffect.Ticking, true, 1);
    }
  }, [isVotingActive, playMusic]);

  const onVoteTimeUp = useCallback(() => {
    if (isVotingActive) {
      stopMusic();
    }
  }, [isVotingActive, stopMusic]);

  return (
    <>
      <div className={styles.dayNightPanelContainer}>
        <div className={styles.phaseControl}>
          <Switcher checked={isNight} onChange={onNightDaySwitch} />
          <Typography variant="h2" className={styles.phaseLabel}>
            {phaseLabel}
          </Typography>
        </div>

      </div>

      {gameFlow.isNight ? <NightPanel /> : <DayPanel />}
    </>
  );
});

GamePanel.displayName = "GamePanel";
