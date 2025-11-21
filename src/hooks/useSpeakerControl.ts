import { useCallback, useRef } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

export const useSpeakerControl = () => {
  const { gamesStore, usersStore } = rootStore;
  const {
    activeGameId,
    gameFlow,
    activeGameAlivePlayers,
    activeGameKilledPlayers,
    activeGamePlayersWithoutGM,
    activeGameGm,
  } = gamesStore;
  const { getUserName, myId } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const previousSpeakerRef = useRef<UserId | null>(null);

  const { muteAllExceptSpeaker, unmuteAllForDay, muteSpeaker, unmuteSpeaker } =
    useBatchMediaControls({
      roomId: activeGameId || "",
      requesterId: myId,
      allUserIds: activeGameAlivePlayers,
    });

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

  const onStartSpeeches = useCallback(() => {
    if (hasSpeaker) return;

    const maxCount = activeGamePlayersWithoutGM.length;
    const day = gameFlow.day;
    let index = day - 1 >= maxCount ? 0 : day - 1;

    while (
      activeGameKilledPlayers.includes(activeGamePlayersWithoutGM[index])
    ) {
      index = (index + 1) % maxCount;
    }

    const speaker = activeGamePlayersWithoutGM[index];
    updateSpeaker(speaker, true); // true - це перший спікер
  }, [
    hasSpeaker,
    activeGamePlayersWithoutGM,
    activeGameKilledPlayers,
    gameFlow.day,
    updateSpeaker,
  ]);

  const onNextSpeaker = useCallback(() => {
    if (!hasSpeaker || activeGameAlivePlayers.length === 0) return;

    const currentSpeakerIndex = activeGameAlivePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    const speaker =
      currentSpeakerIndex === activeGameAlivePlayers.length - 1
        ? activeGameAlivePlayers[0]
        : activeGameAlivePlayers[currentSpeakerIndex + 1];

    updateSpeaker(speaker);
  }, [activeGameAlivePlayers, gameFlow.speaker, hasSpeaker, updateSpeaker]);

  const onPreviousSpeaker = useCallback(() => {
    if (!hasSpeaker || activeGameAlivePlayers.length === 0) return;

    const currentSpeakerIndex = activeGameAlivePlayers.findIndex(
      (player) => player === gameFlow.speaker
    );

    const speaker =
      currentSpeakerIndex === 0
        ? activeGameAlivePlayers[activeGameAlivePlayers.length - 1]
        : activeGameAlivePlayers[currentSpeakerIndex - 1];

    updateSpeaker(speaker);
  }, [activeGameAlivePlayers, gameFlow.speaker, hasSpeaker, updateSpeaker]);

  const onStopSpeeches = useCallback(() => {
    updateGameFlow({
      speaker: "",
      isExtraSpeech: false,
    });

    // Скидаємо попереднього спікера
    previousSpeakerRef.current = null;

    // Вмикаємо мікрофони для всіх
    unmuteAllForDay();
  }, [updateGameFlow, unmuteAllForDay]);

  return {
    speakerName,
    hasSpeaker,
    isVote: gameFlow.isVote,
    speaker: gameFlow.speaker,
    onStartSpeeches,
    onNextSpeaker,
    onPreviousSpeaker,
    onStopSpeeches,
  };
};
