import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";

import {
  useAddUserToProposedMutation,
  useVoteForUserMutation,
} from "@/api/game/queries.ts";
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
  const { isUserGM, speaker, gameFlow, activeGameAlivePlayers, activeGameId } =
    gamesStore;
  const { isVote, proposed, voted, isExtraSpeech } = gameFlow;
  const { isIBlocked } = rootStore;
  const { mutate: voteForUser } = useVoteForUserMutation();
  const { mutate: addUserToProposed } = useAddUserToProposedMutation();

  const votesForThisUser = useMemo(
    () => voted?.[userId] ?? [],
    [voted, userId]
  );

  const amIVoted = useMemo(() => {
    return Object.values(voted ?? {})
      .flat()
      .includes(myId);
  }, [voted, myId]);

  const isUserAddedToVoteList = useMemo(
    () => (userId ? proposed.includes(userId) : false),
    [proposed, userId]
  );

  const isThisUserProposed = useMemo(() => {
    return proposed.includes(userId);
  }, [proposed, userId]);

  const isVotedByThisUser = useMemo(() => {
    return amIVoted && votesForThisUser.includes(myId);
  }, [amIVoted, votesForThisUser, myId]);

  const isCurrentUserGM = isUserGM(userId);

  const shouldShowProposeIcon =
    !!speaker &&
    (isISpeaker || isIGM) &&
    !isMyStream &&
    !isCurrentUserGM &&
    !isExtraSpeech &&
    !isIDead;

  const shouldShowVoteIcon =
    isVote && proposed.includes(userId) && !isIDead && !isIBlocked;

  const onPropose = useCallback(() => {
    if (
      (myId !== speaker && !isUserGM(myId)) ||
      !userId ||
      !activeGameId ||
      isThisUserProposed
    )
      return;

    addUserToProposed({ gameId: activeGameId, userId });
  }, [
    activeGameId,
    addUserToProposed,
    isThisUserProposed,
    isUserGM,
    myId,
    speaker,
    userId,
  ]);

  const onVote = useCallback(() => {
    if (!userId || !myId || !activeGameId) return;
    if (amIVoted || isIGM || isIBlocked) return;

    voteForUser({
      gameId: activeGameId,
      targetUserId: userId,
      voterId: myId,
    });
  }, [userId, myId, activeGameId, amIVoted, isIGM, voteForUser]);

  useVoteResult({
    alivePlayers: activeGameAlivePlayers,
    isIGM,
  });

  return (
    <>
      {shouldShowProposeIcon && (
        <VoteIcon
          className={styles.voteIcon}
          size={ButtonSize.Small}
          variant={ButtonVariant.Secondary}
          isVoted={isUserAddedToVoteList}
          onClick={onPropose}
        />
      )}

      {shouldShowVoteIcon && (
        <div className={styles.iconContainer}>
          <VoteIcon
            className={styles.voteIcon}
            size={ButtonSize.Small}
            variant={ButtonVariant.Secondary}
            onClick={onVote}
            isVoted={isVotedByThisUser}
          />

          {votesForThisUser.length > 0 && (
            <p className={styles.voteCounter}>{votesForThisUser.length}</p>
          )}
        </div>
      )}

      {votesForThisUser.length > 0 && isVote && (
        <ul className={styles.voteList}>
          {votesForThisUser.map((id) => (
            <li key={id}>{getUser(id)?.nikName || "Anonimus"}</li>
          ))}
        </ul>
      )}
    </>
  );
});
