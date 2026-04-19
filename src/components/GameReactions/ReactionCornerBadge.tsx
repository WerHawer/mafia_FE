import { Emoji, EmojiStyle } from "emoji-picker-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { reactionsStore } from "@/store/reactionsStore.ts";

import styles from "./GameReactions.module.scss";

interface ReactionCornerBadgeProps {
  userId: string;
}

/**
 * Shows the latest emoji reaction for a given player in the corner of their video tile.
 * Fades in when a reaction arrives, fades out after 5 seconds (controlled by the store timer).
 */
export const ReactionCornerBadge = observer(({ userId }: ReactionCornerBadgeProps) => {
  const latest = reactionsStore.latestPerUser.get(userId);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!latest) {
      setIsHiding(true);
    } else {
      setIsHiding(false);
    }
  }, [latest]);

  if (!latest && !isHiding) return null;

  return (
    <div className={`${styles.cornerBadge} ${isHiding ? styles.cornerBadgeHiding : ""}`}>
      <Emoji
        unified={getUnified(latest?.emoji ?? "")}
        emojiStyle={EmojiStyle.APPLE}
        size={22}
      />
    </div>
  );
});

ReactionCornerBadge.displayName = "ReactionCornerBadge";

function getUnified(emoji: string): string {
  if (!emoji) return "1f44d"; // fallback
  try {
    return [...emoji]
      .map((c) => c.codePointAt(0)!.toString(16).padStart(4, "0"))
      .join("-");
  } catch {
    return "1f44d";
  }
}
