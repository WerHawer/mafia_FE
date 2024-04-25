import { GameId, IGame, IGameFlow } from "@/types/game.types.ts";
import { useCallback, useEffect, useMemo } from "react";
import { modalStore } from "@/store/modalStore.ts";
import { UserId } from "@/types/user.types.ts";
import { random } from "lodash/fp";
import { UseMutateFunction } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { gamesStore } from "@/store/gamesStore.ts";

type VoteResult = {
  alivePlayers: UserId[];
  time: IGameFlow["votesTime"];
  voted: IGameFlow["voted"];
  proposed: IGameFlow["proposed"];
  enabled: boolean;
  isIGM: boolean;
  updateGameFlow: UseMutateFunction<
    AxiosResponse<IGame, any>,
    Error,
    Partial<IGameFlow>,
    unknown
  >;
};

export const useVoteResult = ({
  voted,
  alivePlayers,
  time,
  enabled,
  proposed,
  updateGameFlow,
  isIGM,
}: VoteResult) => {
  const { openModal, closeModal } = modalStore;
  const { gameFlow } = gamesStore;
  const endTime = useMemo(
    () => (enabled ? time * 1000 + Date.now() : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [time, enabled, gameFlow.isReVote],
  );

  const votedCount = useMemo(
    () => Object.values(voted ?? []).flat().length,
    [voted],
  );

  const randomVote = useCallback(() => {
    if (!isIGM) return;

    const notVotedPlayers = alivePlayers.filter(
      (player) => !Object.values(voted).flat().includes(player),
    );

    const newVoted = { ...voted };

    notVotedPlayers.forEach((player) => {
      const randomIndex = random(0, proposed.length - 1);
      const randomCandidate = proposed[randomIndex];
      const votesForCandidate = newVoted[randomCandidate] ?? [];

      newVoted[randomCandidate] = [...votesForCandidate, player];
    });

    updateGameFlow({
      voted: newVoted,
    });
  }, [alivePlayers, isIGM, proposed, updateGameFlow, voted]);

  useEffect(() => {
    if (!enabled) return;

    if (proposed.length === 1) {
      isIGM && openModal(ModalNames.VoteResultModal);

      return;
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();

      console.log((endTime - currentTime) / 1000);

      if (endTime <= currentTime) {
        if (alivePlayers.length > votedCount) {
          isIGM && randomVote();

          return;
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    alivePlayers.length,
    enabled,
    endTime,
    isIGM,
    openModal,
    proposed.length,
    randomVote,
    time,
    votedCount,
  ]);

  useEffect(() => {
    if (!enabled) return;

    if (alivePlayers.length === votedCount) {
      isIGM && openModal(ModalNames.VoteResultModal);
    }
  }, [alivePlayers, enabled, isIGM, openModal, proposed.length, votedCount]);

  useEffect(() => {
    if (!enabled) {
      closeModal();
    }
  }, [closeModal, enabled]);
};
