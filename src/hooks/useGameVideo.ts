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
  const { shoot = {}, killed = [], sleeping = [], day, isStarted, prostituteBlock, doctorSave, sheriffCheck, donCheck } = gameFlow;
  const { t } = useTranslation();

  const userId = participant.identity;
  const currentUser = isMyStream ? me : getUser(userId);
  const isGM = isUserGM(userId);
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const isIDidShot = Object.values(shoot).some((entry) =>
    entry.shooters?.includes(myId)
  );
  const isUserDead = killed.includes(userId);
  const isSleeping = sleeping.includes(userId);
  const mafiaCount = (gamesStore.activeGameRoles?.mafia ?? []).length;
  const skipFirstNightIfOneMafia = gamesStore.activeGame?.skipFirstNightIfOneMafia ?? true;
  const isFirstNightSkipped = day === 1 && mafiaCount === 1 && skipFirstNightIfOneMafia;
  const notFirstDay = day > 1 || isFirstNightSkipped;
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
  const wakeUpArr = Array.isArray(gameFlow.wakeUp) ? gameFlow.wakeUp : [gameFlow.wakeUp].filter(Boolean);
  const isWokenAsDon = isIDon && isIWakedUp && wakeUpArr.length === 1 && (mafiaCount <= 1 ? isIDidShot : true);

  const isFirstNight = gameFlow.isNight && day === 1;
  const participantRole = gamesStore.getUserRole(userId);
  const isParticipantMafia = participantRole === Roles.Mafia || participantRole === Roles.Don;
  // Show glowing border on first night only for Mafia players viewing other Mafia members,
  // and only when there is more than 1 Mafia player (so they can identify each other).
  const shouldShowMafiaGlow = isFirstNight && mafiaCount > 1 && isIMafia && isParticipantMafia && !isMyStream;
  // Dim non-mafia players during first-night mafia introduction (so mafia can focus on each other)
  const isDimmedDuringMafiaIntro = isFirstNight && mafiaCount > 1 && isIMafia && !isParticipantMafia && !isMyStream;

  const isInvestigateEnabled =
    !isGM && !isUserDead && notFirstDay &&
    ((isISheriff && isIWakedUp && !sheriffCheck && !isMyStream) ||
     (isIDon && isWokenAsDon && !donCheck && !isMyStream));

  const isCheckRoleEnabled = isIGM || gamesStore.isMeObserver || gameFlow.isPostGame;

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

  const onBlockUser = useCallback((x?: number, y?: number) => {
    if (!isKissEnabled) return;
    
    const pos = x !== undefined && y !== undefined 
      ? { x: Math.round(x), y: Math.round(y) } 
      : undefined;
      
    updateGameFlow({ prostituteBlock: userId, prostituteBlockPos: pos });
  }, [isKissEnabled, updateGameFlow, userId]);

  const onHealUser = useCallback(() => {
    if (!isHealEnabled) return;
    updateGameFlow({ doctorSave: userId });
  }, [isHealEnabled, updateGameFlow, userId]);

  const onInvestigateUser = useCallback((): { result: string; isFound: boolean; role?: Roles } | null => {
    if (!isInvestigateEnabled) return null;

    const userRole = gamesStore.getUserRole(userId);

    if (isISheriff) {
      const isMafia = userRole === Roles.Mafia || userRole === Roles.Don;
      updateGameFlow({ sheriffCheck: userId });
      return {
        result: isMafia ? t("checkRole.mafia") : t("checkRole.notMafia"),
        isFound: isMafia,
        role: isMafia ? Roles.Mafia : Roles.Citizen,
      };
    }

    if (isIDon) {
      const isSheriff = userRole === Roles.Sheriff;
      updateGameFlow({ donCheck: userId });
      return {
        result: isSheriff ? t("checkRole.sheriff") : t("checkRole.notSheriff"),
        isFound: isSheriff,
        role: isSheriff ? Roles.Sheriff : Roles.Citizen,
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

  const isVoting = gameFlow.isVote;
  const amIVoted = Object.values(gameFlow.voted ?? {}).flat().includes(myId);
  const isVoter = isVoting && !rootStore.isIDead && !isIGM && !rootStore.isIBlocked && !amIVoted;
  const isVotableTarget = isVoter && gameFlow.proposed.includes(userId) && userId !== myId;
  const isDimmedDuringVote = isVoter && !isVotableTarget;
  const actualSpeakTime = gameFlow.isReVote ? gameFlow.candidateSpeakTime : gameFlow.speakTime;

  return {
    userId,
    currentUser,
    isGM,
    isIGM,
    isUserDead,
    isSleeping,
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
    actualSpeakTime,
    shouldShowMafiaGlow,
    isDimmedDuringMafiaIntro,
    isVotableTarget,
    isDimmedDuringVote,
    onShootUser,
    onBlockUser,
    onHealUser,
    onInvestigateUser,
    participantRole,
  };
};
