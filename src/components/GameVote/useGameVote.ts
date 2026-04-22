import { useCallback, useMemo, useState } from "react";

import {
  useUpdateGameFlowMutation,
  useVoteForUserMutation,
} from "@/api/game/queries.ts";
import { useBatchMediaControls } from "@/hooks/useBatchMediaControls.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

export const useGameVote = () => {
  const { gamesStore, usersStore, isIGM, isIDead } = rootStore;
  const { gameFlow, activeGameId, addVoted } = gamesStore;
  const { getUserName, getUser, myId } = usersStore;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: voteForUser, isPending: isVoting } = useVoteForUserMutation();
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();
  const { muteSpeaker } = useBatchMediaControls();

  const proposedCount = gameFlow.proposed.length;

  const amIVoted = useMemo(() => {
    return Object.values(gameFlow.voted ?? {})
      .flat()
      .includes(myId);
  }, [gameFlow.voted, myId]);

  const votedUserId = useMemo(() => {
    if (!amIVoted) return null;

    const entry = Object.entries(gameFlow.voted ?? {}).find(([, voters]) =>
      voters.includes(myId)
    );

    return entry ? entry[0] : null;
  }, [amIVoted, gameFlow.voted, myId]);

  const canVote = gameFlow.isVote && !isIDead && !isIGM && !rootStore.isIBlocked;
  const isVotingActive = gameFlow.proposed.length > 1 && gameFlow.isVote;

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const onToggleVoting = useCallback(() => {
    const isStarting = !gameFlow.isVote;

    updateGameFlow(
      {
        isVote: isStarting,
        // When re-starting a revote round, clear previous votes
        ...(isStarting && gameFlow.isReVote ? { voted: {} } : {}),
        // isReVote is intentionally NOT reset here — the draw modal manages it
        speaker: "",
      },
      {
        onSuccess: () => {
          muteSpeaker(gameFlow.speaker);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFlow.isVote, gameFlow.isReVote, gameFlow.speaker]);

  const onResetVoting = useCallback(() => {
    updateGameFlow({
      isVote: false,
      isReVote: false,
      voted: {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateGameFlow]);

  const onVoteForPlayer = useCallback(
    (userId: UserId) => {
      if (!canVote || amIVoted || isVoting || !activeGameId || userId === myId) return;

      addVoted({ targetUserId: userId, voterId: myId });
      voteForUser({
        gameId: activeGameId,
        targetUserId: userId,
        voterId: myId,
      });
    },
    [canVote, amIVoted, isVoting, activeGameId, myId, addVoted, voteForUser]
  );

  const getPlayerName = useCallback(
    (userId: UserId): string => {
      return getUserName(userId) ?? "Unknown";
    },
    [getUserName]
  );

  return {
    isOpen,
    proposedCount,
    amIVoted,
    votedUserId,
    canVote,
    isGM: isIGM,
    isVotingActive,
    myId,
    proposed: gameFlow.proposed,
    proposedBy: gameFlow.proposedBy || {},
    voted: gameFlow.voted,
    onToggle,
    onToggleVoting,
    onResetVoting,
    onVoteForPlayer,
    getUserName: getPlayerName,
    getUser,
  };
};
