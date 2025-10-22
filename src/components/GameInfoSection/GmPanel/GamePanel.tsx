import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useRestartGameMutation,
  useStartDayMutation,
  useStartNightMutation,
} from "@/api/game/queries.ts";
import { NightPanel } from "@/components/GameInfoSection/GmPanel/NightPanel.tsx";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";
import { Switcher } from "@/UI/Switcher";

import { DayPanel } from "./DayPanel";
import styles from "./GmPanel.module.scss";

export const GamePanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, modalStore, isIGM } = rootStore;
  const { activeGameId, gameFlow, activeGameRoles, activeGameAlivePlayers } =
    gamesStore;
  const { openModal } = modalStore;

  const { mutate: restartGame } = useRestartGameMutation();
  const { mutate: startDay } = useStartDayMutation();
  const { mutate: startNight } = useStartNightMutation();

  const killedPlayer: UserId[] = useMemo(() => {
    const { shoot = {} } = gameFlow;
    const { mafia } = activeGameRoles ?? {};

    if (!mafia) return [];

    const shootEntries = Object.entries(shoot);

    if (shootEntries.length === 0) return [];

    const aliveMafiaCount = mafia.filter((id) =>
      activeGameAlivePlayers.includes(id)
    ).length;

    const totalShots = shootEntries.reduce(
      (sum, [, shooters]) => sum + shooters.length,
      0
    );

    if (totalShots !== aliveMafiaCount) return [];

    const uniqueTargets = Object.keys(shoot);

    return uniqueTargets.length === 1 ? uniqueTargets : [];
  }, [activeGameAlivePlayers, activeGameRoles, gameFlow]);

  const onNightDaySwitch = useCallback(() => {
    if (gameFlow.isNight && isIGM && gameFlow.day > 1) {
      openModal(ModalNames.NightResultsModal, { killedPlayer });
    }

    if (gameFlow.isNight) {
      startDay(activeGameId);
    } else {
      startNight(activeGameId);
    }

    // TODO: rework with new video architecture
    // manage on/off video for day/night switch
    // const event = gameFlow.isNight ? wsEvents.startDay : wsEvents.startNight;
    // sendMessage(event, { gameId: activeGameId, gm: activeGameGm });
  }, [
    activeGameId,
    gameFlow.day,
    gameFlow.isNight,
    isIGM,
    killedPlayer,
    openModal,
    startDay,
    startNight,
  ]);

  return (
    <>
      <p className={styles.restart} onClick={() => restartGame(activeGameId)}>
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
