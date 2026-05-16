import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { usersStore, gamesStore, isIGM, isIDead } = rootStore;
  const { myId, getUser } = usersStore;
  const { gameFlow } = gamesStore;
  const { isVote, isReVote, proposed, voted } = gameFlow;
  const isVotingActive = isVote || isReVote;
  const isTargetDead = gamesStore.activeGameKilledPlayers.includes(userId);
  const { isIBlocked } = rootStore;

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

  const isVotedByThisUser = useMemo(() => {
    return amIVoted && votesForThisUser.includes(myId);
  }, [amIVoted, votesForThisUser, myId]);

  // Who proposed this player (from any user's perspective)
  const proposerId = gameFlow.proposedBy?.[userId];
  const proposerName = proposerId
    ? getUser(proposerId)?.nikName || "Anonimus"
    : undefined;

  /**
   * STATIC proposed badge: visible to ALL users once this player has been proposed,
   * but ONLY before voting starts and before any votes have been cast.
   */
  const hasVotingOccurred = Object.keys(voted ?? {}).length > 0;
  const shouldShowProposedBadge =
    isUserAddedToVoteList && !isVotingActive && !hasVotingOccurred;

  /** Voting icon: visible to ALL alive, unblocked players for proposed candidates */
  const shouldShowVoteIcon =
    isVote &&
    proposed.includes(userId) &&
    userId !== myId &&
    !isIGM &&
    !isIDead &&
    !isTargetDead &&
    !isIBlocked;

  return (
    <>
      {/* Static proposed badge — visible to EVERYONE once the player is proposed */}
      {shouldShowProposedBadge && (
        <div className={styles.proposeIconContainer}>
          <VoteIcon
            className={classNames(styles.voteIcon, styles.voteIconScaled)}
            size={ButtonSize.Small}
            variant={ButtonVariant.Outline}
            isVoted={true}
          />
        </div>
      )}

      {/* Vote icon — shown only after voting (filled state), or if votes exist to display */}
      {(isVotedByThisUser || votesForThisUser.length > 0) && (
        <div
          className={classNames(
            styles.iconContainer,
            styles.voteIconScaledWrapper
          )}
        >
          <Tippy
            content={shouldShowVoteIcon ? t("vote.voteAgainst") : ""}
            theme="role-tooltip"
            delay={[500, 0]}
            disabled={!shouldShowVoteIcon}
          >
            <div>
              <VoteIcon
                className={classNames(styles.voteIcon, styles.voteIconScaled, {
                  [styles.voteIconDisabled]: !shouldShowVoteIcon,
                })}
                size={ButtonSize.Small}
                variant={ButtonVariant.Outline}
                isVoted={isVotedByThisUser}
              />
            </div>
          </Tippy>

          {votesForThisUser.length > 0 && (
            <p className={styles.voteCounter}>{votesForThisUser.length}</p>
          )}
        </div>
      )}

      {/* Info list — proposer shown only before voting; voters shown if there are any votes */}
      {((!isVotingActive && !hasVotingOccurred && proposerName) ||
        votesForThisUser.length > 0) && (
        <ul className={styles.voteList}>
          {!isVotingActive && !hasVotingOccurred && proposerName && (
            <li className={styles.proposerItem}>⬆️ {proposerName}</li>
          )}
          {votesForThisUser.length > 0 &&
            votesForThisUser.map((id) => (
              <li key={id}>👎 {getUser(id)?.nikName || "Anonimus"}</li>
            ))}
        </ul>
      )}
    </>
  );
});
