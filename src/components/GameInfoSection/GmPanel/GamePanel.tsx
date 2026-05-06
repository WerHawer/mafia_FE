import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { useGamePanel } from "@/hooks/useGamePanel.ts";
import { rootStore } from "@/store/rootStore";
import { Switcher } from "@/UI/Switcher";
import { Typography } from "@/UI/Typography";

import { DayPanel } from "./DayPanel";
import styles from "./GmPanel.module.scss";

export const GamePanel = observer(() => {
  const { t } = useTranslation();
  const { gameFlow, onNightDaySwitch } = useGamePanel();
  const { isNight, day } = gameFlow;

  const phaseLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;

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
