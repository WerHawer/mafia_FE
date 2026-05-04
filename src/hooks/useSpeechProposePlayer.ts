import { useCallback, useMemo } from "react";

import { useAddUserToProposedMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

type UseSpeechProposePlayerParams = {
  userId: UserId;
};

export const useSpeechProposePlayer = ({
  userId,
}: UseSpeechProposePlayerParams) => {
  const { gamesStore, isIGM, isIDead, isISpeaker } = rootStore;
  const { myId } = rootStore.usersStore;
  const { gameFlow, speaker, activeGameId, setToProposed, isUserGM } =
    gamesStore;
  const { day, isExtraSpeech, proposed, proposedBy = {} } = gameFlow;
  const { mutate: addUserToProposed, isPending: isAddingToProposed } =
    useAddUserToProposedMutation();

  const isThisUserProposed = useMemo(
    () => proposed.includes(userId),
    [proposed, userId]
  );

  const speakerAlreadyProposed = useMemo(
    () => Object.values(proposedBy).includes(speaker),
    [proposedBy, speaker]
  );

  const isCurrentUserGM = isUserGM(userId);
  const isImmune = gamesStore.isUserImmune(userId);
  const isTargetDead = gamesStore.activeGameKilledPlayers.includes(userId);

  const canPropose =
    !!speaker &&
    (isISpeaker || isIGM) &&
    userId !== speaker &&
    !isCurrentUserGM &&
    !isExtraSpeech &&
    !isIDead &&
    !isTargetDead &&
    !isImmune &&
    !speakerAlreadyProposed &&
    !isThisUserProposed &&
    day > 1 &&
    !isAddingToProposed;

  const onPropose = useCallback((): void => {
    if (
      !canPropose ||
      !myId ||
      !userId ||
      !activeGameId ||
      (myId !== speaker && !isUserGM(myId))
    ) {
      return;
    }

    setToProposed(userId, speaker);
    addUserToProposed({ gameId: activeGameId, userId, proposerId: speaker });
  }, [
    activeGameId,
    addUserToProposed,
    canPropose,
    isUserGM,
    myId,
    setToProposed,
    speaker,
    userId,
  ]);

  return {
    canPropose,
    isAddingToProposed,
    isThisUserProposed,
    speakerAlreadyProposed,
    onPropose,
  };
};
