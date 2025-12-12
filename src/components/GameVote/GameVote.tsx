import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVoteForUserMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";
import { IconButton } from "@/UI/IconButton";

import styles from "./GameVote.module.scss";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

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

export const GameVote = observer(() => {
  const { t } = useTranslation();
  const { gamesStore, usersStore, isIGM, isIDead } = rootStore;
  const { gameFlow, activeGameId } = gamesStore;
  const { getUserName, myId } = usersStore;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: voteForUser } = useVoteForUserMutation();

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const proposedCount = gameFlow.proposed.length;

  const amIVoted = useMemo(() => {
    return Object.values(gameFlow.voted ?? {})
      .flat()
      .includes(myId);
  }, [gameFlow.voted, myId]);

  const votedUserId = useMemo(() => {
    if (!amIVoted) return null;

    const entry = Object.entries(gameFlow.voted ?? {}).find(([, voters]) =>
      voters.includes(myId)
    );

    return entry ? entry[0] : null;
  }, [amIVoted, gameFlow.voted, myId]);

  const canVote = gameFlow.isVote && !isIDead && !isIGM;

  const onVoteForPlayer = useCallback(
    (userId: UserId) => {
      if (!canVote || amIVoted || !activeGameId) return;

      voteForUser({
        gameId: activeGameId,
        targetUserId: userId,
        voterId: myId,
      });
    },
    [canVote, amIVoted, activeGameId, voteForUser, myId]
  );

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
                  {gameFlow.proposed.map((userId) => {
                    const isVotedByMe = votedUserId === userId;
                    const isClickable = canVote && !amIVoted;

                    return (
                      <li
                        key={userId}
                        className={`${styles.listItem} ${
                          isVotedByMe ? styles.voted : ""
                        } ${isClickable ? styles.clickable : ""}`}
                        onClick={() => isClickable && onVoteForPlayer(userId)}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (
                            isClickable &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            onVoteForPlayer(userId);
                          }
                        }}
                      >
                        {getUserName(userId)}
                        {isVotedByMe && (
                          <span className={styles.votedIndicator}>✓</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
