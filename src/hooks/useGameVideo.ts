import { useCallback } from "react";
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
  const { shoot = {}, killed = [], day, isStarted, prostituteBlock } = gameFlow;

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
  // User cannot shoot themselves
  const isShootEnabled =
    (!isMyStream && !isGM && !isUserDead && notFirstDay) &&
    (isIGM || (isIMafia && isIWakedUp && !isIDidShot));

  const isIDoctor = myRole === Roles.Doctor;

  const isKissEnabled =
    !isMyStream && !isGM && !isUserDead && notFirstDay &&
    isIProstitute && isIWakedUp && !prostituteBlock;

  const isCheckRoleEnabled =
    isIGM ||
    (isICanCheck && (!isMyStream || isIDoctor) && !isGM && !isUserDead && notFirstDay);

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
    isCheckRoleEnabled,
    isCameraEnabled,
    isMicrophoneEnabled,
    toggleCamera,
    toggleMicrophone,
    canControl,
    gameFlow,
    onShootUser,
    onBlockUser,
  };
};
