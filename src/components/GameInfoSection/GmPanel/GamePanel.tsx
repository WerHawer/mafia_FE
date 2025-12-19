import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { Timer, TimerSize } from "@/components/SpeakerTimer/Timer.tsx";
import { useGamePanel } from "@/hooks/useGamePanel.ts";
import { rootStore } from "@/store/rootStore";
import { Switcher } from "@/UI/Switcher";
import { Typography } from "@/UI/Typography";

import { DayPanel } from "./DayPanel";
import styles from "./GmPanel.module.scss";

export const GamePanel = observer(() => {
  const { t } = useTranslation();
  const { gameFlow, onNightDaySwitch } = useGamePanel();
  const { gamesStore } = rootStore;
  const { speaker } = gamesStore;
  const { isNight, day, isVote, isReVote, speakTime, votesTime } = gameFlow;

  const phaseLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;

  const hasSpeaker = Boolean(speaker);
  const isVotingActive = isVote || isReVote;
  const shouldShowTimer = hasSpeaker || isVotingActive;
  const timerValue = isVotingActive ? votesTime : speakTime;
  const timerTrigger = isVotingActive ? isReVote : speaker;

  return (
    <>
      <div className={styles.dayNightPanelContainer}>
        <div className={styles.phaseControl}>
          <Switcher checked={isNight} onChange={onNightDaySwitch} />
          <Typography variant="h2" className={styles.phaseLabel}>
            {phaseLabel}
          </Typography>
        </div>

        {shouldShowTimer && (
          <div className={styles.timerWrapper}>
            <Timer
              time={timerValue}
              resetTrigger={timerTrigger}
              size={TimerSize.Medium}
            />
          </div>
        )}
      </div>

      {gameFlow.isNight ? <NightPanel /> : <DayPanel />}
    </>
  );
});

GamePanel.displayName = "GamePanel";
