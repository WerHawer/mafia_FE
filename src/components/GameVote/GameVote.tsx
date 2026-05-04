import { UsergroupDeleteOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";
import { IconButton } from "@/UI/IconButton";

import styles from "./GameVote.module.scss";
import { useGameVote } from "./useGameVote";
import { VotePanel } from "./VotePanel";

export const GameVote = observer(() => {
  const { t } = useTranslation();
  const {
    proposedCount,
    amIVoted,
    votedUserId,
    canVote,
    proposed,
    proposedBy,
    voted,
    isReVote,
    isGM,
    isVotingActive,
    myId,
    onVoteForPlayer,
    onToggleVoting,
    onResetVoting,
    onGiveSpeech,
    getUserName,
    getUser,
  } = useGameVote();

  const [isGMOpen, setIsGMOpen] = useState(false);

  if (proposedCount === 0 || !isGM) return null;

  const isPanelVisible = isGMOpen;

  let gmVoteTooltip = isVotingActive
    ? t("vote.gmStopVote")
    : t("vote.gmStartVote");
  if (!isVotingActive && isReVote) {
    gmVoteTooltip = t("gm.startReVote", "Почати переголосування"); // fallback to Ukrainian if key doesn't exist
  }

  return (
    <div className={styles.voteContainer}>
      {/* GM-only collapsible header */}
      {isGM && (
        <div className={styles.gmHeaderRow}>
          <button
            className={styles.gmToggleBtn}
            onClick={() => setIsGMOpen((p) => !p)}
          >
            <span>{t("vote.voteList")}</span>
            <span className={styles.badge}>{proposedCount}</span>
            <span
              className={classNames(styles.chevronIcon, {
                [styles.chevronOpen]: isGMOpen,
              })}
            >
              ▾
            </span>
          </button>

          <Tippy
            content={gmVoteTooltip}
            placement="top"
            theme="nav-tooltip"
            delay={[500, 0]}
          >
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
                active={isVotingActive}
              />
            </div>
          </Tippy>
        </div>
      )}

      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            key="vote-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <VotePanel
              proposed={proposed}
              proposedBy={proposedBy}
              votedUserId={votedUserId}
              canVote={canVote}
              amIVoted={amIVoted}
              isGM={isGM}
              isVotingActive={isVotingActive}
              isReVote={isReVote}
              myId={myId}
              voted={voted}
              onVoteForPlayer={onVoteForPlayer}
              onToggleVoting={onToggleVoting}
              onResetVoting={onResetVoting}
              onGiveSpeech={onGiveSpeech}
              getUserName={getUserName}
              getUser={getUser}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GameVote.displayName = "GameVote";
