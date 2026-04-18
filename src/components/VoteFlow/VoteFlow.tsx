import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
import Tippy from "@tippyjs/react";
import { useTranslation } from "react-i18next";
import classNames from "classnames";

import {
  useAddUserToProposedMutation,
  useVoteForUserMutation,
} from "@/api/game/queries.ts";
import { useVoteResult } from "@/hooks/useVoteResult.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { UserId } from "@/types/user.types.ts";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { VoteIcon } from "@/UI/VoteIcon";

import styles from "./VoteFlow.module.scss";

type VoteFlowProps = {
  isMyStream: boolean;
  userId: UserId;
};

export const VoteFlow = observer(({ isMyStream, userId }: VoteFlowProps) => {
  const { t } = useTranslation();
  const { usersStore, gamesStore, isIGM, isIDead, isISpeaker, soundStore } = rootStore;
  const { myId, getUser } = usersStore;
  const { isUserGM, speaker, gameFlow, activeGameAlivePlayers, activeGameId, setToProposed, addVoted } =
    gamesStore;
  const { isVote, proposed, voted, isExtraSpeech } = gameFlow;
  const { isIBlocked } = rootStore;
  const { playSfx } = soundStore;
  const { mutate: voteForUser, isPending: isVoting } = useVoteForUserMutation();
  const { mutate: addUserToProposed, isPending: isAddingToProposed } = useAddUserToProposedMutation();

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
    !isIDead &&
    gameFlow.day > 1;

  const shouldShowVoteIcon =
    isVote && proposed.includes(userId) && !isIDead && !isIBlocked;

  const onPropose = useCallback(() => {
    if (
      (myId !== speaker && !isUserGM(myId)) ||
      !userId ||
      !activeGameId ||
      isThisUserProposed ||
      isAddingToProposed ||
      gameFlow.day <= 1
    )
      return;

    setToProposed(userId);
    addUserToProposed({ gameId: activeGameId, userId });
  }, [
    activeGameId,
    addUserToProposed,
    isThisUserProposed,
    isAddingToProposed,
    isUserGM,
    myId,
    setToProposed,
    speaker,
    userId,
    gameFlow.day,
  ]);

  const onVote = useCallback(() => {
    if (!userId || !myId || !activeGameId) return;
    if (amIVoted || isIGM || isIBlocked || isVoting) return;

    addVoted({ targetUserId: userId, voterId: myId });
    voteForUser({
      gameId: activeGameId,
      targetUserId: userId,
      voterId: myId,
    });
    playSfx(SoundEffect.Vote);
  }, [userId, myId, activeGameId, amIVoted, isIGM, isIBlocked, isVoting, addVoted, voteForUser, playSfx]);

  useVoteResult({
    alivePlayers: activeGameAlivePlayers,
    isIGM,
  });

  return (
    <>
      {shouldShowProposeIcon && (
        <div className={styles.proposeIconContainer}>
          <Tippy content={t("vote.proposePlayer")} theme="role-tooltip" delay={[500, 0]}>
            <div>
              <VoteIcon
                className={classNames(styles.voteIcon, styles.voteIconScaled)}
                size={ButtonSize.Small}
                variant={ButtonVariant.Secondary}
                isVoted={isUserAddedToVoteList}
                onClick={onPropose}
              />
            </div>
          </Tippy>
        </div>
      )}

      {shouldShowVoteIcon && (
        <div className={classNames(styles.iconContainer, styles.voteIconScaledWrapper)}>
          <Tippy content={t("vote.voteAgainst")} theme="role-tooltip" delay={[500, 0]}>
            <div>
              <VoteIcon
                className={classNames(styles.voteIcon, styles.voteIconScaled)}
                size={ButtonSize.Small}
                variant={ButtonVariant.Secondary}
                onClick={onVote}
                isVoted={isVotedByThisUser}
              />
            </div>
          </Tippy>

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
