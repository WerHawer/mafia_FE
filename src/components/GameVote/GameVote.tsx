import { UsergroupDeleteOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";
import { IconButton } from "@/UI/IconButton";

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
    voted,
    isGM,
    isVotingActive,
    onToggle,
    onVoteForPlayer,
    onToggleVoting,
    getUserName,
  } = useGameVote();

  if (proposedCount === 0) {
    return null;
  }

  const gmVoteTooltip = isVotingActive
    ? t("vote.gmStopVote")
    : t("vote.gmStartVote");

  return (
    <>
      <div className={styles.toggleButtonContainer}>
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

        {isGM && proposedCount > 0 && (
          <Tippy content={gmVoteTooltip} placement="top" theme="dark">
            <div>
              <IconButton
                icon={<UsergroupDeleteOutlined />}
                onClick={onToggleVoting}
                variant={
                  isVotingActive
                    ? ButtonVariant.Tertiary
                    : ButtonVariant.Primary
                }
                size={ButtonSize.Small}
                ariaLabel={gmVoteTooltip}
                className={styles.gmVoteButton}
                active={isVotingActive}
              />
            </div>
          </Tippy>
        )}
      </div>

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
              isGM={isGM}
              isVotingActive={isVotingActive}
              voted={voted}
              onToggle={onToggle}
              onVoteForPlayer={onVoteForPlayer}
              onToggleVoting={onToggleVoting}
              getUserName={getUserName}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
});
