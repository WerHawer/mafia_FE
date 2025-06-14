import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useVoteResult } from "@/hooks/useVoteResult.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { VoteIcon } from "@/UI/VoteIcon";

import styles from "./VoteFlow.module.scss";

type VoteFlowProps = {
  isMyStream: boolean;
  userId: UserId;
};

export const VoteFlow = observer(({ isMyStream, userId }: VoteFlowProps) => {
  const { usersStore, gamesStore, isIGM, isIDead, isISpeaker } = rootStore;
  const { myId, getUser } = usersStore;
  const { isUserGM, speaker, gameFlow, activeGameAlivePlayers } = gamesStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const votesForThisUser = useMemo(
    () => gameFlow.voted?.[userId] ?? [],
    [gameFlow.voted, userId]
  );

  const amIVoted = useMemo(() => {
    return Object.values(gameFlow.voted ?? {})
      .flat()
      .includes(myId);
  }, [gameFlow.voted, myId]);

  const isUserAddedToVoteList = useMemo(
    () => (userId ? gameFlow.proposed.includes(userId) : false),
    [gameFlow.proposed, userId]
  );

  const isVotedByThisUser = useMemo(() => {
    return amIVoted && votesForThisUser.includes(myId);
  }, [amIVoted, votesForThisUser, myId]);

  const isCurrentUserGM = isUserGM(userId);

  const shouldShowProposeIcon =
    !!speaker &&
    (isISpeaker || isIGM) &&
    !isMyStream &&
    !isCurrentUserGM &&
    !gameFlow.isExtraSpeech &&
    !isIDead;

  const shouldShowVoteIcon =
    gameFlow.isVote && gameFlow.proposed.includes(userId) && !isIDead;

  const handleVotePropose = useCallback(() => {
    if ((myId !== speaker && !isUserGM(myId)) || !userId) return;

    const newList = isUserAddedToVoteList
      ? gameFlow.proposed.filter((id) => id !== userId)
      : [...gameFlow.proposed, userId];

    const newVoted = newList.reduce(
      (acc, id) => {
        acc[id] = [];

        return acc;
      },
      {} as Record<UserId, UserId[]>
    );

    updateGameFlow({ proposed: newList, voted: newVoted });
  }, [
    gameFlow,
    isUserAddedToVoteList,
    isUserGM,
    myId,
    speaker,
    updateGameFlow,
    userId,
  ]);

  const handleVote = useCallback(() => {
    if (!userId || !myId) return;
    if (amIVoted || isIGM) return;

    updateGameFlow({
      voted: {
        ...(gameFlow.voted ?? {}),
        [userId]: [...votesForThisUser, myId],
      },
    });
  }, [
    userId,
    myId,
    amIVoted,
    isIGM,
    updateGameFlow,
    gameFlow.voted,
    votesForThisUser,
  ]);

  useVoteResult({
    voted: gameFlow.voted,
    alivePlayers: activeGameAlivePlayers,
    time: gameFlow.votesTime,
    enabled: gameFlow.isVote,
    proposed: gameFlow.proposed,
    isIGM,
    updateGameFlow,
  });

  return (
    <>
      {shouldShowProposeIcon && (
        <VoteIcon
          className={styles.voteIcon}
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          isVoted={isUserAddedToVoteList}
          onClick={handleVotePropose}
        />
      )}

      {shouldShowVoteIcon && (
        <div className={styles.iconContainer}>
          <VoteIcon
            className={styles.voteIcon}
            size={ButtonSize.Small}
            variant={ButtonVariant.Secondary}
            onClick={handleVote}
            isVoted={isVotedByThisUser}
          />

          {votesForThisUser.length > 0 && (
            <p className={styles.voteCounter}>{votesForThisUser.length}</p>
          )}
        </div>
      )}

      {votesForThisUser.length > 0 && gameFlow.isVote && (
        <ul className={styles.voteList}>
          {votesForThisUser.map((id) => (
            <li key={id}>{getUser(id)?.nikName || "Anonimus"}</li>
          ))}
        </ul>
      )}
    </>
  );
});
