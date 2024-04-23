import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { VoteIcon } from "@/UI/VoteIcon";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { usersStore } from "@/store/usersStore.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { UserId } from "@/types/user.types.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import styles from "./VoteFlow.module.scss";

type VoteFlowProps = {
  isMyStream: boolean;
  userId: UserId;
};

export const VoteFlow = observer(({ isMyStream, userId }: VoteFlowProps) => {
  const { myId, getUser } = usersStore;
  const { isUserGM, speaker, gameFlow, activeGameId } = gamesStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation(gameFlow);

  const isUserAddedToVoteList = useMemo(
    () => (userId ? gameFlow.proposed.includes(userId) : false),
    [gameFlow.proposed, userId],
  );

  const isISpeaker = speaker === myId;
  const isCurrentUserGM = isUserGM(userId);
  const isIGM = isUserGM(myId);

  const shouldShowVoteIcon =
    !!speaker && (isISpeaker || isIGM) && !isMyStream && !isCurrentUserGM;

  const votesForThisUser = useMemo(
    () => gameFlow.voted?.[userId] ?? [],
    [gameFlow.voted, userId],
  );
  const amIVoted = useMemo(() => {
    return Object.values(gameFlow.voted ?? {})
      .flat()
      .includes(myId);
  }, [gameFlow.voted, myId]);

  const handleVotePropose = useCallback(() => {
    if ((myId !== speaker && !isUserGM(myId)) || !userId) return;

    const newList = isUserAddedToVoteList
      ? gameFlow.proposed.filter((id) => id !== userId)
      : [...gameFlow.proposed, userId];

    updateGameFlow({
      gameId: activeGameId,
      newFlow: { proposed: newList },
    });
  }, [
    activeGameId,
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
      gameId: activeGameId,
      newFlow: {
        voted: {
          ...(gameFlow.voted ?? {}),
          [userId]: [...votesForThisUser, myId],
        },
      },
    });
  }, [
    userId,
    myId,
    amIVoted,
    isIGM,
    updateGameFlow,
    activeGameId,
    gameFlow.voted,
    votesForThisUser,
  ]);

  return (
    <>
      {shouldShowVoteIcon && (
        <VoteIcon
          className={styles.voteIcon}
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          isVoted={isUserAddedToVoteList}
          onClick={handleVotePropose}
        />
      )}

      {gameFlow.isVoteTime && gameFlow.proposed.includes(userId) && (
        <div className={styles.iconContainer}>
          <VoteIcon size={ButtonSize.Large} onClick={handleVote} />
          {votesForThisUser.length > 0 && (
            <p className={styles.voteCounter}>{votesForThisUser.length}</p>
          )}
        </div>
      )}

      {votesForThisUser.length > 0 && (
        <ul className={styles.voteList}>
          {votesForThisUser.map((id) => (
            <li key={id}>{getUser(id)?.name || "Anonimus"}</li>
          ))}
        </ul>
      )}
    </>
  );
});
