import { useCallback, useRef } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

export const useSpeakerControl = () => {
  const { gamesStore, usersStore } = rootStore;
  const {
    gameFlow,
    activeGameAlivePlayers,
    activeGameKilledPlayers,
    activeGamePlayersWithoutGM,
    activeGameGm,
  } = gamesStore;
  const { getUserName } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const previousSpeakerRef = useRef<UserId | null>(null);

  const { muteAllExceptSpeaker, muteSpeaker, unmuteSpeaker } =
    useBatchMediaControls();

  const speakerName = getUserName(gameFlow.speaker);
  const hasSpeaker = Boolean(gameFlow.speaker);

  const updateSpeaker = useCallback(
    (speaker: UserId, isFirstSpeaker: boolean = false) => {
      updateGameFlow(
        {
          speaker,
          isExtraSpeech: false,
        },
        {
          onSuccess: () => {
            if (isFirstSpeaker) {
              muteAllExceptSpeaker(speaker, activeGameGm);
              unmuteSpeaker(speaker);
              previousSpeakerRef.current = speaker;

              return;
            }

            const hasPreviousSpeaker = previousSpeakerRef.current !== null;
            const isPreviousSpeakerNotGM =
              previousSpeakerRef.current !== activeGameGm;

            if (hasPreviousSpeaker && isPreviousSpeakerNotGM) {
              muteSpeaker(previousSpeakerRef.current!);
            }

            unmuteSpeaker(speaker);
            previousSpeakerRef.current = speaker;
          },
        }
      );
    },
    [
      activeGameGm,
      muteAllExceptSpeaker,
      muteSpeaker,
      unmuteSpeaker,
      updateGameFlow,
    ]
  );

  const eligiblePlayers = activeGameAlivePlayers.filter(
    (player) => player !== gameFlow.prostituteBlock
  );

  const onStartSpeeches = useCallback(() => {
    if (hasSpeaker) return;

    const maxCount = activeGamePlayersWithoutGM.length;
    const day = gameFlow.day;
    let index = day - 1 >= maxCount ? 0 : day - 1;

    // Prevent infinite loop if somehow all players are killed/blocked
    let attempts = 0;
    while (
      (activeGameKilledPlayers.includes(activeGamePlayersWithoutGM[index]) ||
        activeGamePlayersWithoutGM[index] === gameFlow.prostituteBlock) &&
      attempts < maxCount
    ) {
      index = (index + 1) % maxCount;
      attempts++;
    }

    const speaker = activeGamePlayersWithoutGM[index];
    updateSpeaker(speaker, true); // true - це перший спікер
  }, [
    hasSpeaker,
    activeGamePlayersWithoutGM,
    activeGameKilledPlayers,
    gameFlow.day,
    gameFlow.prostituteBlock,
    updateSpeaker,
  ]);

  const onNextSpeaker = useCallback(() => {
    if (!hasSpeaker || eligiblePlayers.length === 0) return;

    const currentSpeakerIndex = eligiblePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    // If current speaker is not in eligibleList (e.g. was just blocked), we start from 0
    const nextIndex = currentSpeakerIndex === -1 ? 0 : currentSpeakerIndex + 1;
    const speaker = nextIndex >= eligiblePlayers.length
        ? eligiblePlayers[0]
        : eligiblePlayers[nextIndex];

    updateSpeaker(speaker);
  }, [eligiblePlayers, gameFlow.speaker, hasSpeaker, updateSpeaker]);

  const onPreviousSpeaker = useCallback(() => {
    if (!hasSpeaker || eligiblePlayers.length === 0) return;

    const currentSpeakerIndex = eligiblePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    // If current speaker is not in eligibleList, we start from end
    const prevIndex = currentSpeakerIndex === -1 ? eligiblePlayers.length - 1 : currentSpeakerIndex - 1;
    const speaker = prevIndex < 0
        ? eligiblePlayers[eligiblePlayers.length - 1]
        : eligiblePlayers[prevIndex];

    updateSpeaker(speaker);
  }, [eligiblePlayers, gameFlow.speaker, hasSpeaker, updateSpeaker]);

  const onStopSpeeches = useCallback(() => {
    updateGameFlow({
      speaker: "",
      isExtraSpeech: false,
    });

    muteSpeaker(previousSpeakerRef.current!);
    previousSpeakerRef.current = null;
  }, [updateGameFlow, muteSpeaker]);

  return {
    speakerName,
    hasSpeaker,
    isVote: gameFlow.isVote,
    speaker: gameFlow.speaker,
    speakTime: gameFlow.isReVote ? gameFlow.candidateSpeakTime : gameFlow.speakTime,
    onStartSpeeches,
    onNextSpeaker,
    onPreviousSpeaker,
    onStopSpeeches,
  };
};
