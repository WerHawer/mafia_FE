import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { Timer } from "@/components/SpeakerTimer/Timer.tsx";
import { rootStore } from "@/store/rootStore";
import { Typography } from "@/UI/Typography";

import styles from "./PlayerPanel.module.scss";

export const PlayerPanelInfo = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, myRole } = rootStore;
  const { gameFlow, speaker } = gamesStore;

  const { day, isNight, isVote, isReVote, speakTime, votesTime } = gameFlow;

  const dayNightLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;
  const roleLabel = t(`roles.${myRole}`);
  const hasSpeaker = Boolean(speaker);

  const time = isVote || isReVote ? votesTime : speakTime;

  const shouldShowTimer = hasSpeaker || isVote || isReVote;

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

      {shouldShowTimer ? <Timer resetTrigger={speaker} time={time} /> : null}
    </div>
  );
});

PlayerPanelInfo.displayName = "PlayerPanelInfo";
