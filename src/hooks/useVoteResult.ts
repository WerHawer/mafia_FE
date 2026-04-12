import { random } from "lodash/fp";
import { useCallback, useEffect, useMemo } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

type VoteResult = {
  alivePlayers: UserId[];
  isIGM: boolean;
};

export const useVoteResult = ({ alivePlayers }: VoteResult) => {
  const { openModal, closeModal } = modalStore;
  const { gameFlow } = gamesStore;
  const { isIGM } = rootStore;
  const { voted, votesTime, proposed, isVote, isReVote, prostituteBlock } =
    gameFlow;

  const enabled = isVote || isReVote;

  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  // Players who are eligible to vote: alive players excluding the one blocked by prostitute.
  // A blocked player can neither vote manually nor receive an auto-random vote.
  const eligibleVoters = useMemo(
    () => alivePlayers.filter((player) => player !== prostituteBlock),
    [alivePlayers, prostituteBlock]
  );

  const endVoteTime = useMemo(
    () => votesTime * 1000 + Date.now(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [votesTime, isVote, isReVote]
  );

  const votedCount = useMemo(
    () => Object.values(voted ?? {}).flat().length,
    [voted, isReVote, isVote]
  );

  const randomVote = useCallback(() => {
    if (!isIGM) return;

    // Only auto-vote for eligible voters (blocked player is excluded)
    const notVotedPlayers = eligibleVoters.filter(
      (player) => !Object.values(voted).flat().includes(player)
    );

    const newVoted = { ...voted };

    notVotedPlayers.forEach((player) => {
      const randomIndex = random(0, proposed.length - 1);
      const randomCandidate = proposed[randomIndex];
      const prevCandidateVoices = newVoted[randomCandidate] ?? [];

      newVoted[randomCandidate] = [...prevCandidateVoices, player];
    });

    updateGameFlow({
      voted: newVoted,
    });
  }, [eligibleVoters, isIGM, proposed, updateGameFlow, voted]);

  useEffect(() => {
    if (!enabled) return;

    if (proposed.length === 1 && isIGM) {
      openModal(ModalNames.VoteResultModal);

      return;
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const isTimeOver = endVoteTime <= currentTime;

      if (!isTimeOver) return;

      clearInterval(interval);

      if (eligibleVoters.length > votedCount && isIGM) {
        randomVote();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    eligibleVoters.length,
    enabled,
    endVoteTime,
    isIGM,
    openModal,
    proposed.length,
    randomVote,
    votedCount,
  ]);

  useEffect(() => {
    if (!enabled) return;

    // Modal opens when all eligible voters have voted (blocked player is excluded from the count)
    if (eligibleVoters.length === votedCount && isIGM) {
      openModal(ModalNames.VoteResultModal);
    }
  }, [
    eligibleVoters,
    eligibleVoters.length,
    enabled,
    isIGM,
    openModal,
    votedCount,
  ]);

  useEffect(() => {
    if (!enabled) {
      closeModal();
    }
  }, [closeModal, enabled]);
};
