import { Participant } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaControls } from "@/hooks/useMediaControls.ts";
import { useNightTargetAction } from "@/hooks/useNightTargetAction.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

type UseGameVideoParams = {
  participant: Participant;
  isMyStream: boolean;
};

/** Короткий flash обводки для ГМ/духів при нічній дії на цьому тайлі. */
export type SightedNightFlash = "shoot" | "kiss" | "heal" | "check";

const SIGHTED_NIGHT_OUTLINE_MS = 1500;

type NightActionSnap = {
  shotCount: number;
  prostituteBlock: string | undefined;
  doctorSave: string | undefined;
  sheriffCheck: string | undefined;
  donCheck: string | undefined;
};

export const useGameVideo = ({
  participant,
  isMyStream,
}: UseGameVideoParams) => {
  const {
    usersStore,
    gamesStore,
    isIGM,
    myRole,
  } = rootStore;
  const { getUser, me, myId } = usersStore;
  const { isUserGM, isMeObserver, gameFlow, activeGameId } = gamesStore;
  const {
    shoot = {},
    killed = [],
    sleeping = [],
    day,
    isStarted,
    prostituteBlock,
    doctorSave,
    sheriffCheck,
    donCheck,
  } = gameFlow;

  const userId = participant.identity;
  const nightShotCount = shoot[userId]?.shooters?.length ?? 0;
  const currentUser = isMyStream ? me : getUser(userId);
  const isGM = isUserGM(userId);
  const isUserDead = killed.includes(userId);
  const isSleeping = sleeping.includes(userId);
  const mafiaCount = (gamesStore.activeGameRoles?.mafia ?? []).length;
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;

  const isFirstNight = gameFlow.isNight && day === 1;
  const participantRole = gamesStore.getUserRole(userId);
  const isParticipantMafia =
    participantRole === Roles.Mafia || participantRole === Roles.Don;
  // Show glowing border on first night only for Mafia players viewing other Mafia members,
  // and only when there is more than 1 Mafia player (so they can identify each other).
  const shouldShowMafiaGlow =
    isFirstNight &&
    mafiaCount > 1 &&
    isIMafia &&
    isParticipantMafia &&
    !isMyStream;
  // Dim non-mafia players during first-night mafia introduction (so mafia can focus on each other)
  const isDimmedDuringMafiaIntro =
    isFirstNight &&
    mafiaCount > 1 &&
    isIMafia &&
    !isParticipantMafia &&
    !isMyStream;

  const isCheckRoleEnabled = isIGM || isMeObserver || gameFlow.isPostGame;
  const {
    isShootEnabled,
    isKissEnabled,
    isHealEnabled,
    isInvestigateEnabled,
    onShootUser,
    onBlockUser,
    onHealUser,
    onInvestigateUser,
  } = useNightTargetAction({ userId, isMyStream });

  const [sightedNightFlash, setSightedNightFlash] =
    useState<SightedNightFlash | null>(null);
  const prevNightSnapRef = useRef<NightActionSnap | null>(null);
  const sightedFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const clearFlashTimer = () => {
      if (sightedFlashTimeoutRef.current) {
        clearTimeout(sightedFlashTimeoutRef.current);
        sightedFlashTimeoutRef.current = null;
      }
    };

    const isSightedNight = (isIGM || isMeObserver) && gameFlow.isNight;

    if (!isSightedNight) {
      prevNightSnapRef.current = null;
      setSightedNightFlash(null);
      clearFlashTimer();

      return;
    }

    const shotCount = shoot[userId]?.shooters?.length ?? 0;
    const nextSnap: NightActionSnap = {
      shotCount,
      prostituteBlock,
      doctorSave,
      sheriffCheck,
      donCheck,
    };

    const prevSnap = prevNightSnapRef.current;
    prevNightSnapRef.current = nextSnap;

    if (!prevSnap) {
      return;
    }

    let flash: SightedNightFlash | null = null;

    if (shotCount > prevSnap.shotCount) {
      flash = "shoot";
    } else if (
      prostituteBlock === userId &&
      prevSnap.prostituteBlock !== userId
    ) {
      flash = "kiss";
    } else if (doctorSave === userId && prevSnap.doctorSave !== userId) {
      flash = "heal";
    } else if (
      (sheriffCheck === userId && prevSnap.sheriffCheck !== userId) ||
      (donCheck === userId && prevSnap.donCheck !== userId)
    ) {
      flash = "check";
    }

    if (!flash) {
      return;
    }

    clearFlashTimer();
    setSightedNightFlash(flash);
    sightedFlashTimeoutRef.current = setTimeout(() => {
      sightedFlashTimeoutRef.current = null;
      setSightedNightFlash(null);
    }, SIGHTED_NIGHT_OUTLINE_MS);

    return clearFlashTimer;
  }, [
    isIGM,
    isMeObserver,
    gameFlow.isNight,
    userId,
    nightShotCount,
    prostituteBlock,
    doctorSave,
    sheriffCheck,
    donCheck,
  ]);

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
  const amIVoted = Object.values(gameFlow.voted ?? {})
    .flat()
    .includes(myId);
  const isVoter =
    isVoting &&
    !rootStore.isIDead &&
    !isIGM &&
    !rootStore.isIBlocked &&
    !amIVoted;
  const isVotableTarget =
    isVoter &&
    gameFlow.proposed.includes(userId) &&
    userId !== myId &&
    !isUserDead;
  const isDimmedDuringVote = isVoter && !isVotableTarget;
  const actualSpeakTime = gameFlow.isReVote
    ? gameFlow.candidateSpeakTime
    : gameFlow.speakTime;

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
    sightedNightFlash,
  };
};
