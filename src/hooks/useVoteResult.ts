import { random } from "lodash/fp";
import { useCallback, useEffect, useMemo, useRef } from "react";

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

// How long to wait after stopping voting before reading final state and randomizing.
// Gives any last-second in-flight manual votes time to arrive.
const VOTE_SETTLE_DELAY_MS = 800;

export const useVoteResult = ({ alivePlayers }: VoteResult) => {
  const { openModal, closeModal } = modalStore;
  const { gameFlow } = gamesStore;
  const { isIGM } = rootStore;
  const { voted, votesTime, proposed, isVote, isReVote, prostituteBlock } =
    gameFlow;

  const enabled = isVote || isReVote;

  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  // Players who are eligible to vote: alive players excluding the one blocked by prostitute.
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

  // Ref so randomVote always reads the freshest voted state without recreating on every vote.
  const votedRef = useRef(voted);
  votedRef.current = voted;

  // Ref so eligibleVoters is always fresh inside the setTimeout callback.
  const eligibleVotersRef = useRef(eligibleVoters);
  eligibleVotersRef.current = eligibleVoters;

  // Prevents the auto-randomize from firing more than once per voting round.
  const hasAutoVotedRef = useRef(false);

  // Reset the flag at the start of each new voting round.
  useEffect(() => {
    if (enabled) {
      hasAutoVotedRef.current = false;
    }
  }, [enabled, isVote, isReVote]);

  /**
   * Assigns random candidates to every eligible voter who hasn't voted yet,
   * then opens the result modal.
   *
   * Called AFTER a settle delay, so votedRef.current reflects any last-second
   * manual votes that were in-flight when the timer fired.
   */
  const randomVote = useCallback(() => {
    if (!isIGM) return;

    const currentVoted = votedRef.current;
    const currentEligible = eligibleVotersRef.current;

    const notVotedPlayers = currentEligible.filter(
      (player) => !Object.values(currentVoted).flat().includes(player)
    );

    if (notVotedPlayers.length === 0) {
      // Everyone voted manually in the grace period — just open the modal.
      openModal(ModalNames.VoteResultModal);
      return;
    }

    const newVoted = { ...currentVoted };

    notVotedPlayers.forEach((player) => {
      let candidateList = proposed.filter((p) => p !== player);
      if (candidateList.length === 0) {
        candidateList = proposed;
      }

      const randomIndex = random(0, candidateList.length - 1);
      const randomCandidate = candidateList[randomIndex];
      newVoted[randomCandidate] = [
        ...(newVoted[randomCandidate] ?? []),
        player,
      ];
    });

    updateGameFlow(
      { voted: newVoted },
      {
        onSuccess: () => {
          openModal(ModalNames.VoteResultModal);
        },
      }
    );
  }, [isIGM, proposed, updateGameFlow, openModal]);

  useEffect(() => {
    if (!enabled) return;

    if (proposed.length === 1 && isIGM) {
      // Single candidate — all eligible votes go to them automatically.
      const automaticVoted = { [proposed[0]]: eligibleVoters };
      updateGameFlow({ voted: automaticVoted });
      openModal(ModalNames.VoteResultModal);
      return;
    }

    const interval = setInterval(() => {
      const isTimeOver = endVoteTime <= Date.now();
      if (!isTimeOver) return;

      clearInterval(interval);

      if (!isIGM || hasAutoVotedRef.current) return;
      hasAutoVotedRef.current = true;

      // Step 1: Stop voting on ALL clients immediately so no new manual votes can be cast.
      updateGameFlow(
        { isVote: false },
        {
          onSuccess: () => {
            // Step 2: Wait for any last-second in-flight manual votes to arrive.
            setTimeout(() => {
              randomVote();
            }, VOTE_SETTLE_DELAY_MS);
          },
        }
      );
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    eligibleVoters,
    eligibleVoters.length,
    enabled,
    endVoteTime,
    isIGM,
    openModal,
    proposed,
    proposed.length,
    randomVote,
    updateGameFlow,
  ]);

  // Opens the result modal as soon as every eligible voter has voted (manual path).
  useEffect(() => {
    if (!enabled) return;
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
