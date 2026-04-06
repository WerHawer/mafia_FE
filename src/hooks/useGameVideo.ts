import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Participant } from "livekit-client";

import { useShootUserMutation, useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useMediaControls } from "@/hooks/useMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

type UseGameVideoParams = {
  participant: Participant;
  isMyStream: boolean;
};

export const useGameVideo = ({
  participant,
  isMyStream,
}: UseGameVideoParams) => {
  const { usersStore, gamesStore, isIGM, myRole, isIWakedUp, isICanCheck, isIProstitute } =
    rootStore;
  const { getUser, me, myId } = usersStore;
  const { isUserGM, gameFlow, activeGameId } = gamesStore;
  const { shoot = {}, killed = [], day, isStarted, prostituteBlock, doctorSave, sheriffCheck, donCheck } = gameFlow;
  const { t } = useTranslation();

  const userId = participant.identity;
  const currentUser = isMyStream ? me : getUser(userId);
  const isGM = isUserGM(userId);
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const isIDidShot = Object.values(shoot).some((entry) =>
    entry.shooters?.includes(myId)
  );
  const isUserDead = killed.includes(userId);
  const isMyAfterStart = isMyStream && isStarted;
  const notFirstDay = day > 1;
  // Mafia can also shoot themselves
  const isShootEnabled =
    (!isGM && !isUserDead && notFirstDay) &&
    (isIGM || (isIMafia && isIWakedUp && !isIDidShot));

  const isIDoctor = myRole === Roles.Doctor;

  const isKissEnabled =
    !isMyStream && !isGM && !isUserDead && notFirstDay &&
    isIProstitute && isIWakedUp && !prostituteBlock;

  const isHealEnabled =
    (!isGM && !isUserDead && notFirstDay) &&
    isIDoctor && isIWakedUp && !doctorSave;

  const isISheriff = myRole === Roles.Sheriff;
  const isIDon = myRole === Roles.Don;

  // Don can investigate only when woken up as Don specifically (wakeUp has only his id).
  // If Don is the sole mafia member, he's always woken alone anyway, so require shoot-first.
  const mafiaCount = (gamesStore.activeGameRoles?.mafia ?? []).length;
  const wakeUpArr = Array.isArray(gameFlow.wakeUp) ? gameFlow.wakeUp : [gameFlow.wakeUp].filter(Boolean);
  const isWokenAsDon = isIDon && isIWakedUp && wakeUpArr.length === 1 && (mafiaCount <= 1 ? isIDidShot : true);

  const isInvestigateEnabled =
    !isGM && !isUserDead && notFirstDay &&
    ((isISheriff && isIWakedUp && !sheriffCheck && !isMyStream) ||
     (isIDon && isWokenAsDon && !donCheck && !isMyStream));

  const isCheckRoleEnabled = isIGM;

  const { mutate: shootUser } = useShootUserMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const onShootUser = useCallback((x?: number, y?: number) => {
    if (!activeGameId || !isShootEnabled || isIGM) return;

    const shot = x !== undefined && y !== undefined
      ? { x: Math.round(x), y: Math.round(y) }
      : undefined;

    shootUser({
      gameId: activeGameId,
      targetUserId: userId,
      shooterId: myId,
      shot,
    });
  }, [activeGameId, isIGM, isShootEnabled, myId, shootUser, userId]);

  const onBlockUser = useCallback(() => {
    if (!isKissEnabled) return;
    updateGameFlow({ prostituteBlock: userId });
  }, [isKissEnabled, updateGameFlow, userId]);

  const onHealUser = useCallback(() => {
    if (!isHealEnabled) return;
    updateGameFlow({ doctorSave: userId });
  }, [isHealEnabled, updateGameFlow, userId]);

  const onInvestigateUser = useCallback((): { result: string; isDanger: boolean } | null => {
    if (!isInvestigateEnabled) return null;

    const userRole = gamesStore.getUserRole(userId);

    if (isISheriff) {
      const isMafia = userRole === Roles.Mafia || userRole === Roles.Don;
      updateGameFlow({ sheriffCheck: userId });
      return {
        result: isMafia ? t("checkRole.mafia") : t("checkRole.notMafia"),
        isDanger: isMafia,
      };
    }

    if (isIDon) {
      const isSheriff = userRole === Roles.Sheriff;
      updateGameFlow({ donCheck: userId });
      return {
        result: isSheriff ? t("checkRole.sheriff") : t("checkRole.notSheriff"),
        isDanger: isSheriff,
      };
    }

    return null;
  }, [isInvestigateEnabled, isISheriff, isIDon, gamesStore, userId, updateGameFlow, t]);

  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    toggleCamera,
    toggleMicrophone,
    canControl,
  } = useMediaControls({
    participant,
    isMyStream,
    isIGM,
    roomId: activeGameId || "",
    requesterId: myId,
  });

  return {
    userId,
    currentUser,
    isGM,
    isIGM,
    isUserDead,
    isMyAfterStart,
    isShootEnabled,
    isKissEnabled,
    isHealEnabled,
    isInvestigateEnabled,
    isCheckRoleEnabled,
    isCameraEnabled,
    isMicrophoneEnabled,
    toggleCamera,
    toggleMicrophone,
    canControl,
    gameFlow,
    onShootUser,
    onBlockUser,
    onHealUser,
    onInvestigateUser,
  };
};
