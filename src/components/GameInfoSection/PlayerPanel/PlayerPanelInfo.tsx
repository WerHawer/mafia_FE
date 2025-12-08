import { capitalize } from "lodash";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { rootStore } from "@/store/rootStore";
import { Typography } from "@/UI/Typography";

import styles from "./PlayerPanel.module.scss";

export const PlayerPanelInfo = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, myRole } = rootStore;
  const { gameFlow } = gamesStore;

  const { day, isNight } = gameFlow;

  const dayNightLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;
  const roleLabel = capitalize(myRole);

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

      <div className={styles.timerSection}>
        <Typography variant="caption" className={styles.timerPlaceholder}>
          {t("game.timer_placeholder")}
        </Typography>
      </div>
    </div>
  );
});

PlayerPanelInfo.displayName = "PlayerPanelInfo";
