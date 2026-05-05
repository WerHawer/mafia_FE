import { useEffect, useMemo, useRef } from "react";

import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { rootStore } from "@/store/rootStore.ts";
import { useSocket } from "@/hooks/useSocket.ts";

export const useVoteResult = () => {
  const { openModal, closeModal } = modalStore;
  const { gameFlow } = gamesStore;
  const { isIGM } = rootStore;
  const { voted, isVote, isReVote } = gameFlow;
  const { subscribe } = useSocket();

  const votedCount = useMemo(
    () => Object.values(voted ?? {}).flat().length,
    [voted, isReVote, isVote]
  );

  // Tracks the previous isVote value to detect true → false transition.
  const prevIsVoteRef = useRef(isVote);

  // Prevents double-opening the modal when both voteTimerExpired WS event
  // and the isVote-transition effect fire for the same voting round.
  const isModalOpenedRef = useRef(false);

  // Reset the guard at the start of each new voting round.
  useEffect(() => {
    if (isVote) {
      isModalOpenedRef.current = false;
    }
  }, [isVote, isReVote]);

  // Primary signal: BE emits voteTimerExpired after timer expired and missing
  // votes have been randomized server-side. Opens the modal immediately on GM.
  useEffect(() => {
    return subscribe(wsEvents.voteTimerExpired, () => {
      if (!isIGM || isModalOpenedRef.current) return;
      isModalOpenedRef.current = true;
      openModal(ModalNames.VoteResultModal);
    });
  }, [subscribe, isIGM, openModal]);

  // Secondary signal: detect isVote transitioning true → false from any gameUpdate.
  // Covers the all-voted-early path (BE closes voting when all players voted)
  // and acts as a fallback for the timer-expired path.
  useEffect(() => {
    const wasVote = prevIsVoteRef.current;
    prevIsVoteRef.current = isVote;

    if (!wasVote || isVote) return;

    if (isIGM && votedCount > 0 && !isModalOpenedRef.current) {
      isModalOpenedRef.current = true;
      openModal(ModalNames.VoteResultModal);

      return;
    }

    // Voting ended with no votes — GM manually cancelled. Close any open modal.
    if (votedCount === 0) {
      closeModal();
    }
  }, [isVote, votedCount, isIGM, openModal, closeModal]);
};
