import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { useGamePanel } from "@/hooks/useGamePanel.ts";
import { Switcher } from "@/UI/Switcher";

import { DayPanel } from "./DayPanel";
import styles from "./GmPanel.module.scss";

export const GamePanel = observer(() => {
  const { t } = useTranslation();
  const { gameFlow, onNightDaySwitch, onRestartGame } = useGamePanel();

  return (
    <>
      <p className={styles.restart} onClick={onRestartGame}>
        {t("game.restart")}
      </p>

      <div className={styles.dayNightPanelContainer}>
        <Switcher checked={gameFlow.isNight} onChange={onNightDaySwitch} />
        {gameFlow.isNight ? (
          <p>{t("game.night")}</p>
        ) : (
          <p>
            {t("game.day")} {gameFlow.day}
          </p>
        )}
      </div>

      {gameFlow.isNight ? <NightPanel /> : <DayPanel />}
    </>
  );
});

GamePanel.displayName = "GamePanel";
