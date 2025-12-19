import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  useStartDayMutation,
  useStartNightMutation,
} from "@/api/game/queries.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

export const useGamePanel = () => {
  const { gamesStore, modalStore, isIGM } = rootStore;
  const {
    activeGameId,
    gameFlow,
    activeGameRoles,
    activeGameAlivePlayers,
    activeGameGm,
  } = gamesStore;
  const { openModal } = modalStore;
  const isShouldShowModal = useRef(false);

  const { mutate: startDay } = useStartDayMutation();
  const { mutate: startNight } = useStartNightMutation();

  const { muteAllForNight, unmuteAllForDay } = useBatchMediaControls();

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
    if (!activeGameId) return;

    if (gameFlow.isNight) {
      startDay(activeGameId);
      unmuteAllForDay();
      isShouldShowModal.current = true;

      return;
    }

    startNight(activeGameId);
    muteAllForNight(activeGameGm);
  }, [
    activeGameId,
    activeGameGm,
    gameFlow.isNight,
    startDay,
    startNight,
    unmuteAllForDay,
    muteAllForNight,
  ]);

  useEffect(() => {
    if (
      !gameFlow.isNight &&
      isIGM &&
      gameFlow.day > 2 &&
      isShouldShowModal.current
    ) {
      openModal(ModalNames.NightResultsModal, { killedPlayer });
      isShouldShowModal.current = false;
    }
  }, [gameFlow.day, gameFlow.isNight, isIGM, killedPlayer, openModal]);

  return {
    gameFlow,
    onNightDaySwitch,
  };
};
