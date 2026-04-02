import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useStartDayMutation,
  useStartNightMutation,
} from "@/api/game/queries.ts";
import { ModalNames, NightActionLogs } from "@/components/Modals/Modal.types.ts";
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
  const [nightActionLogs, setNightActionLogs] = useState<NightActionLogs>({});

  const { mutate: startDay } = useStartDayMutation();
  const { mutate: startNight } = useStartNightMutation();

  const { muteAllForNight, unmuteAllForDay } = useBatchMediaControls();

  // nightActionLogs will store all results required for the modal

  const onNightDaySwitch = useCallback(() => {
    if (!activeGameId) return;

    if (gameFlow.isNight) {
      const { shoot = {}, doctorSave, prostituteBlock, sheriffCheck, donCheck } = gameFlow;
      const { mafia } = activeGameRoles ?? {};
      const aliveMafiaCount = mafia ? mafia.filter((id) => activeGameAlivePlayers.includes(id)).length : 0;

      const shootEntries = Object.entries(shoot);
      const totalShots = shootEntries.reduce((sum, [, shooters]) => sum + shooters.length, 0);
      const uniqueTargets = Object.keys(shoot);
      
      let mafiaMissReason: "noShots" | "notAllShot" | "splitShots" | "savedByDoctor" | undefined = undefined;
      let killedPlayerId: UserId | undefined = undefined;

      if (totalShots === 0) {
         mafiaMissReason = "noShots";
      } else if (totalShots < aliveMafiaCount) {
         mafiaMissReason = "notAllShot";
      } else if (uniqueTargets.length > 1) {
         mafiaMissReason = "splitShots";
      } else if (uniqueTargets[0] === doctorSave) {
         mafiaMissReason = "savedByDoctor";
      } else {
         killedPlayerId = uniqueTargets[0];
      }

      setNightActionLogs({
        targetedByMafia: uniqueTargets,
        savedByDoctor: doctorSave,
        blockedByProstitute: prostituteBlock,
        sheriffChecked: sheriffCheck,
        donChecked: donCheck,
        mafiaMissReason,
        killedPlayer: killedPlayerId,
        totalShots,
        aliveMafiaCount
      });

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
      openModal(ModalNames.NightResultsModal, { nightActionLogs });
      isShouldShowModal.current = false;
    }
  }, [gameFlow.day, gameFlow.isNight, isIGM, nightActionLogs, openModal]);

  return {
    gameFlow,
    onNightDaySwitch,
  };
};
