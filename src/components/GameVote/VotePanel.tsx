import { UsergroupDeleteOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { IUser, UserId } from "@/types/user.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";

import styles from "./GameVote.module.scss";
import { VoteListItem } from "./VoteListItem";

type VotePanelProps = {
  proposed: UserId[];
  proposedBy: Record<UserId, UserId>;
  votedUserId: UserId | null;
  canVote: boolean;
  amIVoted: boolean;
  isGM: boolean;
  isVotingActive: boolean;
  myId: UserId;
  voted: { [key: UserId]: UserId[] };
  onVoteForPlayer: (userId: UserId) => void;
  onToggleVoting: () => void;
  onResetVoting: () => void;
  getUserName: (userId: UserId) => string;
  getUser: (userId: UserId) => IUser | undefined;
};

export const VotePanel = ({
  proposed,
  proposedBy,
  votedUserId,
  canVote,
  amIVoted,
  isGM,
  isVotingActive,
  myId,
  voted,
  onVoteForPlayer,
  onToggleVoting,
  onResetVoting,
  getUserName,
  getUser,
}: VotePanelProps) => {
  const { t } = useTranslation();

  const buttonText = isVotingActive ? t("vote.gmStopVote") : t("vote.gmStartVote");
  const buttonVariant = isVotingActive ? ButtonVariant.Tertiary : ButtonVariant.Primary;

  return (
    <>
      <p className={styles.listTitle}>{t("vote.voteList")}</p>
      <ul className={styles.list}>
      {proposed?.map((userId) => {
        if (!userId) return null;

        const isVotedByMe = votedUserId === userId;
        const isClickable = canVote && !amIVoted && userId !== myId;
        const voteCount = voted?.[userId]?.length || 0;
        const proposerId = proposedBy?.[userId];
        const proposerName = proposerId ? getUserName(proposerId) : undefined;
        const proposerAvatar = proposerId ? getUser(proposerId)?.avatar : undefined;
        const candidateAvatar = getUser(userId)?.avatar;
        const votersList = (voted?.[userId] || []).map((id) => getUserName(id));

        return (
          <VoteListItem
            key={userId}
            userId={userId}
            userName={getUserName(userId)}
            isVotedByMe={isVotedByMe}
            isClickable={isClickable}
            isVotingActive={isVotingActive}
            voteCount={voteCount}
            proposerName={proposerName}
            proposerAvatar={proposerAvatar}
            candidateAvatar={candidateAvatar}
            votersList={votersList}
            onVote={onVoteForPlayer}
          />
        );
      })}

      {isGM && (
        <li className={styles.gmVoteControlItem}>
          <Button
            onClick={onToggleVoting}
            variant={buttonVariant}
            size={ButtonSize.Small}
            className={classNames(styles.gmVoteControlButton, {
              [styles.active]: isVotingActive,
            })}
          >
            <UsergroupDeleteOutlined className={styles.icon} />
            <span>{buttonText}</span>
          </Button>

          <Button
            onClick={onResetVoting}
            variant={ButtonVariant.Error}
            size={ButtonSize.Small}
            className={styles.gmResetButton}
          >
            <span>{t("vote.resetVoting")}</span>
          </Button>
        </li>
      )}
    </ul>
    </>
  );
};

VotePanel.displayName = "VotePanel";
