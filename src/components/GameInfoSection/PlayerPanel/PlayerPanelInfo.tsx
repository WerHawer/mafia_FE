import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocketContext } from "@/context/SocketProvider.tsx";
import { modalStore } from "@/store/modalStore.ts";
import { rootStore } from "@/store/rootStore";
import { SoundEffect } from "@/store/soundStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Typography } from "@/UI/Typography";

import styles from "./PlayerPanel.module.scss";

export const PlayerPanelInfo = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, soundStore, usersStore, myRole } = rootStore;
  const { gameFlow, speaker } = gamesStore;
  const { myId } = usersStore;
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
  const gameId = gamesStore.activeGameId;

  return (
    <div className={styles.infoContainer}>
      <div className={styles.dayNightSection}>
        {isNight ? (
          <MoonOutlined className={styles.phaseIcon} />
        ) : (
          <SunOutlined className={styles.phaseIcon} />
        )}
        <Typography variant="body" className={styles.dayNightText}>
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
              <Typography variant="span" className={styles.ghostIcon}>
                👻
              </Typography>
              <Typography variant="body" className={styles.ghostText}>
                {t("ghostMode.activeIndicator")}
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
                      socket.emit(wsEvents.setObserverMode, {
                        gameId,
                        userId: myId,
                      });
                    }
                  },
                });
              }}
            >
              {t("ghostMode.openEyes")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

PlayerPanelInfo.displayName = "PlayerPanelInfo";
