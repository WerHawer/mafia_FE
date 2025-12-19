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
  const { gameFlow, activeGameId } = gamesStore;
  const { getUserName, myId } = usersStore;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: voteForUser } = useVoteForUserMutation();
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

  const canVote = gameFlow.isVote && !isIDead && !isIGM;
  const isVotingActive = gameFlow.proposed.length > 1 && gameFlow.isVote;

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const onToggleVoting = useCallback(() => {
    updateGameFlow(
      {
        isVote: !gameFlow.isVote,
        speaker: "",
      },
      {
        onSuccess: () => {
          muteSpeaker(gameFlow.speaker);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFlow.isVote, gameFlow.speaker]);

  const onVoteForPlayer = useCallback(
    (userId: UserId) => {
      if (!canVote || amIVoted || !activeGameId) return;

      voteForUser({
        gameId: activeGameId,
        targetUserId: userId,
        voterId: myId,
      });
    },
    [canVote, amIVoted, activeGameId, voteForUser, myId]
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
    proposed: gameFlow.proposed,
    voted: gameFlow.voted,
    onToggle,
    onToggleVoting,
    onVoteForPlayer,
    getUserName: getPlayerName,
  };
};
