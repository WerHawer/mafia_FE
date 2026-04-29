import { DislikeFilled, DislikeOutlined, SoundOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { KeyboardEvent, memo } from "react";

import { UserId } from "@/types/user.types.ts";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";

import styles from "./GameVote.module.scss";

type VoteListItemProps = {
  userId: UserId;
  userName: string;
  isVotedByMe: boolean;
  isClickable: boolean;
  isSelf: boolean;
  isVotingActive: boolean;
  voteCount: number;
  proposerName?: string;
  proposerAvatar?: string;
  candidateAvatar?: string;
  votersList?: string[];
  onVote: (userId: UserId) => void;
  isGM?: boolean;
  onGiveSpeech?: (userId: UserId) => void;
};

export const VoteListItem = memo(
  ({
    userId,
    userName,
    isVotedByMe,
    isClickable,
    isSelf,
    isVotingActive,
    voteCount,
    proposerName,
    proposerAvatar,
    candidateAvatar,
    votersList,
    onVote,
    isGM,
    onGiveSpeech,
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
          [styles.selfItem]: isSelf,
        })}
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        {/* Main row: [Proposer avatar + name → Candidate avatar + name] + [👎] */}
        <div className={styles.itemMain}>
          <span className={styles.itemFlow}>
            {/* Show proposer only when voting hasn't started yet */}
            {!isVotingActive && proposerName && (
              <>
                <UserAvatar avatar={proposerAvatar} name={proposerName} customSize={20} className={styles.avatar} />
                <span className={styles.proposerName}>{proposerName}</span>
                <span className={styles.arrow}>→</span>
              </>
            )}
            <UserAvatar avatar={candidateAvatar} name={userName} customSize={20} className={styles.avatar} />
            <span className={styles.candidateName}>{userName}</span>
          </span>

          <div className={styles.itemRight}>
            {isGM && onGiveSpeech && (
              <button
                className={styles.speechBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onGiveSpeech(userId);
                }}
                title="Дати слово"
              >
                <SoundOutlined />
              </button>
            )}

            <span
              className={classNames(styles.thumbIcon, {
                [styles.thumbActive]: isVotedByMe,
                [styles.thumbClickable]: isClickable && !isVotedByMe,
              })}
            >
              {isVotedByMe ? <DislikeFilled /> : <DislikeOutlined />}
              {voteCount > 0 && (
                <span className={styles.voteCount}>{voteCount}</span>
              )}
            </span>
          </div>
        </div>

        {/* Voters row — names of who voted, indented under candidate */}
        {votersList && votersList.length > 0 && (
          <div className={styles.votersRow}>
            {votersList.join(", ")}
          </div>
        )}
      </li>
    );
  }
);

VoteListItem.displayName = "VoteListItem";
