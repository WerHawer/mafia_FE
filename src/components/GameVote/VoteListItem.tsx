import { memo } from "react";

import { UserId } from "@/types/user.types.ts";

import styles from "./GameVote.module.scss";

type VoteListItemProps = {
  userId: UserId;
  userName: string;
  isVotedByMe: boolean;
  isClickable: boolean;
  onVote: (userId: UserId) => void;
};

export const VoteListItem = memo(
  ({
    userId,
    userName,
    isVotedByMe,
    isClickable,
    onVote,
  }: VoteListItemProps) => {
    const handleClick = () => {
      if (isClickable) {
        onVote(userId);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onVote(userId);
      }
    };

    return (
      <li
        className={`${styles.listItem} ${
          isVotedByMe ? styles.voted : ""
        } ${isClickable ? styles.clickable : ""}`}
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        {userName}
        {isVotedByMe && <span className={styles.votedIndicator}>✓</span>}
      </li>
    );
  }
);

VoteListItem.displayName = "VoteListItem";
