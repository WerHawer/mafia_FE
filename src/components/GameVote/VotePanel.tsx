import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { UserId } from "@/types/user.types.ts";
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
  onToggle: () => void;
  onVoteForPlayer: (userId: UserId) => void;
  getUserName: (userId: UserId) => string;
};

export const VotePanel = ({
  proposed,
  votedUserId,
  canVote,
  amIVoted,
  onToggle,
  onVoteForPlayer,
  getUserName,
}: VotePanelProps) => {
  const { t } = useTranslation();

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
          {proposed.map((userId) => {
            const isVotedByMe = votedUserId === userId;
            const isClickable = canVote && !amIVoted;

            return (
              <VoteListItem
                key={userId}
                userId={userId}
                userName={getUserName(userId)}
                isVotedByMe={isVotedByMe}
                isClickable={isClickable}
                onVote={onVoteForPlayer}
              />
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
};

VotePanel.displayName = "VotePanel";
