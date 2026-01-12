import { UsergroupDeleteOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { UserId } from "@/types/user.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";
import { IconButton } from "@/UI/IconButton";

import styles from "./GameVote.module.scss";
import { VoteListItem } from "./VoteListItem";

const panelVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    x: 40,
    y: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: {
    scale: 0,
    opacity: 0,
    x: 40,
    y: 0,
  },
};

type VotePanelProps = {
  proposed: UserId[];
  votedUserId: UserId | null;
  canVote: boolean;
  amIVoted: boolean;
  isGM: boolean;
  isVotingActive: boolean;
  voted: { [key: UserId]: UserId[] };
  onToggle: () => void;
  onVoteForPlayer: (userId: UserId) => void;
  onToggleVoting: () => void;
  getUserName: (userId: UserId) => string;
};

export const VotePanel = ({
  proposed,
  votedUserId,
  canVote,
  amIVoted,
  isGM,
  isVotingActive,
  voted,
  onToggle,
  onVoteForPlayer,
  onToggleVoting,
  getUserName,
}: VotePanelProps) => {
  const { t } = useTranslation();

  const buttonText = isVotingActive
    ? t("vote.gmStopVote")
    : t("vote.gmStartVote");
  const buttonVariant = isVotingActive
    ? ButtonVariant.Tertiary
    : ButtonVariant.Primary;

  return (
    <motion.div
      className={styles.panel}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <IconButton
        className={styles.closeButton}
        icon="×"
        onClick={onToggle}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        ariaLabel="Close vote list"
      />

      <div className={styles.panelHeader}>
        <h3>{t("vote.voteList")}</h3>
      </div>

      <div className={styles.listContainer}>
        <ul className={styles.list}>
          {proposed?.map((userId) => {
            if (!userId) return null;

            const isVotedByMe = votedUserId === userId;
            const isClickable = canVote && !amIVoted;
            const voteCount = voted?.[userId]?.length || 0;

            return (
              <VoteListItem
                key={userId}
                userId={userId}
                userName={getUserName(userId)}
                isVotedByMe={isVotedByMe}
                isClickable={isClickable}
                voteCount={voteCount}
                onVote={onVoteForPlayer}
              />
            );
          })}

          {isGM && (
            <li className={styles.gmVoteControlItem}>
              <Button
                onClick={onToggleVoting}
                variant={buttonVariant}
                size={ButtonSize.Medium}
                className={classNames(styles.gmVoteControlButton, {
                  [styles.active]: isVotingActive,
                })}
              >
                <UsergroupDeleteOutlined className={styles.icon} />
                <span>{buttonText}</span>
              </Button>
            </li>
          )}
        </ul>
      </div>
    </motion.div>
  );
};

VotePanel.displayName = "VotePanel";
