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

// How long to wait after the timer fires before reading final state and randomizing.
// Gives any last-second in-flight manual votes time to arrive.
const VOTE_SETTLE_DELAY_MS = 800;

export const useVoteResult = ({ alivePlayers }: VoteResult) => {
  const { openModal, closeModal } = modalStore;
  const { gameFlow } = gamesStore;
  const { isIGM } = rootStore;
  const { voted, votesTime, proposed, isVote, isReVote, prostituteBlock } =
    gameFlow;

  const enabled = isVote;

  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const proposedStr = proposed.join(',');
  const stableProposed = useMemo(() => (proposedStr ? proposedStr.split(',') : []), [proposedStr]);

  const alivePlayersStr = alivePlayers.join(',');
  // Players who are eligible to vote: alive players excluding the one blocked by prostitute.
  const eligibleVoters = useMemo(
    () => (alivePlayersStr ? alivePlayersStr.split(',') : []).filter((player) => player !== prostituteBlock),
    [alivePlayersStr, prostituteBlock]
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

  // Refs so randomVote always reads the freshest state without recreating on every change.
  const votedRef = useRef(voted);
  votedRef.current = voted;

  const eligibleVotersRef = useRef(eligibleVoters);
  eligibleVotersRef.current = eligibleVoters;

  // Keeps a fresh copy of proposed so randomVote uses the correct candidates
  // even if a WS event updates (or resets) proposed between the timer firing
  // and the settle-delay callback executing.
  const proposedRef = useRef(stableProposed);
  proposedRef.current = stableProposed;

  // Prevents the auto-randomize from firing more than once per voting round.
  const hasAutoVotedRef = useRef(false);
  // Prevents single candidate auto-vote from firing multiple times if other dependencies change.
  const hasAutoVotedForSingleRef = useRef(false);

  // Reset the flag at the start of each new voting round.
  useEffect(() => {
    if (enabled) {
      hasAutoVotedRef.current = false;
      hasAutoVotedForSingleRef.current = false;
    }
  }, [enabled, isVote, isReVote]);

  /**
   * Assigns random candidates to every eligible voter who hasn't voted yet,
   * then sends a SINGLE atomic update: { isVote: false, voted: newVoted }.
   *
   * Combining both fields in one request eliminates the race condition that
   * occurred with the previous two-step approach:
   *   Step 1: updateGameFlow({ isVote: false })
   *   Step 2: updateGameFlow({ voted: newVoted })  ← could read a WS-reset store
   *
   * The BE was broadcasting a WS event after step 1 that could reset proposed/voted
   * before step 2's mutation read gamesStore.gameFlow, causing VoteResultsModal to
   * see voted:{} + proposed:[] and render "unexpected result".
   */
  const randomVote = useCallback(() => {
    if (!isIGM) return;

    const currentVoted = votedRef.current;
    const currentEligible = eligibleVotersRef.current;
    const currentProposed = proposedRef.current;

    const notVotedPlayers = currentEligible.filter(
      (player) => !Object.values(currentVoted).flat().includes(player)
    );

    if (notVotedPlayers.length === 0) {
      // Everyone voted manually in the grace period — just close voting and open the modal.
      updateGameFlow(
        { isVote: false },
        { onSuccess: () => openModal(ModalNames.VoteResultModal) }
      );

      return;
    }

    const newVoted = { ...currentVoted };

    notVotedPlayers.forEach((player) => {
      let candidateList = currentProposed.filter((p) => p !== player);
      if (candidateList.length === 0) {
        candidateList = currentProposed;
      }

      const randomIndex = random(0, candidateList.length - 1);
      const randomCandidate = candidateList[randomIndex];
      newVoted[randomCandidate] = [
        ...(newVoted[randomCandidate] ?? []),
        player,
      ];
    });

    // Single atomic update — stops voting AND persists randomized votes together.
    // This prevents a WS broadcast from the isVote:false step overwriting the
    // store before the voted:newVoted step can run.
    updateGameFlow(
      { isVote: false, voted: newVoted },
      {
        onSuccess: () => {
          openModal(ModalNames.VoteResultModal);
        },
      }
    );
  }, [isIGM, updateGameFlow, openModal]);

  useEffect(() => {
    if (!enabled) return;

    if (stableProposed.length === 1 && isIGM) {
      if (hasAutoVotedForSingleRef.current) return;
      hasAutoVotedForSingleRef.current = true;

      // Single candidate — all eligible votes go to them automatically.
      const automaticVoted = { [stableProposed[0]]: eligibleVoters };
      updateGameFlow({ voted: automaticVoted });
      openModal(ModalNames.VoteResultModal);
      return;
    }

    const interval = setInterval(() => {
      const currentVotedCount = Object.values(votedRef.current ?? {}).flat().length;
      if (currentVotedCount >= eligibleVotersRef.current.length) {
        clearInterval(interval);
        return;
      }

      const isTimeOver = endVoteTime <= Date.now();
      if (!isTimeOver) return;

      clearInterval(interval);

      if (!isIGM || hasAutoVotedRef.current) return;
      hasAutoVotedRef.current = true;

      // Wait for any last-second in-flight manual votes to arrive, then
      // atomically randomize missing votes AND stop voting in a single call.
      // Previously we called updateGameFlow({ isVote: false }) here first,
      // which caused a race: the BE's WS broadcast could reset proposed/voted
      // before the randomVote mutation ran, producing "unexpected result".
      setTimeout(() => {
        randomVote();
      }, VOTE_SETTLE_DELAY_MS);
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
    stableProposed,
    stableProposed.length,
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
