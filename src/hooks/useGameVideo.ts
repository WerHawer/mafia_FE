import { Participant } from "livekit-client";

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
  const { usersStore, gamesStore, isIGM, myRole, isIWakedUp, isICanCheck } =
    rootStore;
  const { getUser, me, myId } = usersStore;
  const { isUserGM, gameFlow, activeGameId } = gamesStore;
  const { shoot = {}, killed = [], day, isStarted } = gameFlow;

  const userId = participant.identity;
  const currentUser = isMyStream ? me : getUser(userId);
  const isGM = isUserGM(userId);
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const isIDidShot = Object.values(shoot).some((shooters) =>
    shooters.includes(myId)
  );
  const isUserDead = killed.includes(userId);
  const isMyAfterStart = isMyStream && isStarted;
  const notFirstDay = day > 1;
  const isShootEnabled =
    isIGM || (isIMafia && isIWakedUp && !isGM && notFirstDay && !isIDidShot);

  const isCheckRoleEnabled =
    isIGM ||
    (isICanCheck && !isMyStream && !isGM && !isUserDead && notFirstDay);

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
    isCheckRoleEnabled,
    isCameraEnabled,
    isMicrophoneEnabled,
    toggleCamera,
    toggleMicrophone,
    canControl,
    gameFlow,
  };
};
