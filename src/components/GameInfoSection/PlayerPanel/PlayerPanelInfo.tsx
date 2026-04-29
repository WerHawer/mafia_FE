import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Timer, TimerSize } from "@/components/SpeakerTimer/Timer.tsx";
import { rootStore } from "@/store/rootStore";
import { SoundEffect } from "@/store/soundStore.ts";
import { Typography } from "@/UI/Typography";
import { useSocketContext } from "@/context/SocketProvider.tsx";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { modalStore } from "@/store/modalStore.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import styles from "./PlayerPanel.module.scss";

export const PlayerPanelInfo = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, soundStore, myRole } = rootStore;
  const { gameFlow, speaker } = gamesStore;
  const { stopMusic, playMusic } = soundStore;

  const { day, isNight, isVote, isReVote, votesTime } = gameFlow;

  const dayNightLabel = isNight ? t("game.night") : `${t("game.day")} ${day}`;
  const roleLabel = t(`roles.${myRole}`);
  const time = votesTime;
  const isVotingActive = isVote || isReVote;
  const timerTrigger = `${isVote}-${isReVote}`;
  const shouldShowTimer = isVotingActive;

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

  const { socket } = useSocketContext();
  const myId = rootStore.usersStore.myId;
  const gameId = gamesStore.activeGameId;

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

      {gamesStore.activeGameKilledPlayers.includes(myId || "") && (
        <div className={styles.ghostModeSection}>
          {gamesStore.isMeObserver ? (
            <div className={styles.ghostActive}>
              <Typography variant="span" className={styles.ghostIcon}>👻</Typography>
              <Typography variant="body" className={styles.ghostText}>
                {t("ghostMode.activeIndicator", "Ghost Mode Active")}
              </Typography>
            </div>
          ) : (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Small}
              onClick={() => {
                modalStore.openModal(ModalNames.GhostModeModal, {
                  onConfirm: () => {
                    if (socket && gameId && myId) {
                      socket.emit(wsEvents.setObserverMode, { gameId, userId: myId });
                    }
                  }
                })
              }}
            >
              {t("ghostMode.openEyes", "Open Eyes")}
            </Button>
          )}
        </div>
      )}

    </div>
  );
});

PlayerPanelInfo.displayName = "PlayerPanelInfo";
