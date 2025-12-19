import { DislikeOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { KeyboardEvent, memo } from "react";

import { UserId } from "@/types/user.types.ts";

import styles from "./GameVote.module.scss";

type VoteListItemProps = {
  userId: UserId;
  userName: string;
  isVotedByMe: boolean;
  isClickable: boolean;
  voteCount: number;
  onVote: (userId: UserId) => void;
};

export const VoteListItem = memo(
  ({
    userId,
    userName,
    isVotedByMe,
    isClickable,
    voteCount,
    onVote,
  }: VoteListItemProps) => {
    const handleClick = () => {
      if (isClickable) {
        onVote(userId);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isClickable && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onVote(userId);
      }
    };

    return (
      <li
        className={classNames(styles.listItem, {
          [styles.voted]: isVotedByMe,
          [styles.clickable]: isClickable,
        })}
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.playerName}>{userName}</span>

        <div className={styles.voteInfo}>
          {isVotedByMe && (
            <span className={styles.votedIndicator}>
              <DislikeOutlined />
            </span>
          )}

          {voteCount > 0 && (
            <span className={styles.voteCount}>{voteCount}</span>
          )}
        </div>
      </li>
    );
  }
);

VoteListItem.displayName = "VoteListItem";
