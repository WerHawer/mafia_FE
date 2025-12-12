import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";

import styles from "./GameVote.module.scss";
import { useGameVote } from "./useGameVote";
import { VotePanel } from "./VotePanel";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const GameVote = observer(() => {
  const { t } = useTranslation();
  const {
    isOpen,
    proposedCount,
    amIVoted,
    votedUserId,
    canVote,
    proposed,
    onToggle,
    onVoteForPlayer,
    getUserName,
  } = useGameVote();

  if (proposedCount === 0) {
    return null;
  }

  return (
    <>
      <Button
        className={styles.toggleButton}
        onClick={onToggle}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Small}
        aria-label="Toggle vote list"
      >
        {t("vote.voteList")}
        {proposedCount > 0 && (
          <span className={styles.badge}>{proposedCount}</span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.overlay}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={onToggle}
            />

            <VotePanel
              proposed={proposed}
              votedUserId={votedUserId}
              canVote={canVote}
              amIVoted={amIVoted}
              onToggle={onToggle}
              onVoteForPlayer={onVoteForPlayer}
              getUserName={getUserName}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
});
