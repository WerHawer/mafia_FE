import { Emoji, EmojiStyle } from "emoji-picker-react";
import { observer } from "mobx-react-lite";

import { reactionsStore } from "@/store/reactionsStore.ts";

import styles from "./GameReactions.module.scss";

/**
 * Global overlay that renders all currently-active floating emoji reactions.
 * Each emoji floats upward from a randomized X position with a wobble effect.
 * Pointer events disabled so it never interrupts the game UI.
 */
export const FloatingReactions = observer(() => {
  return (
    <div className={styles.floatingContainer} aria-hidden="true">
      {reactionsStore.reactions.map((reaction) => (
        <div
          key={reaction.id}
          className={styles.floatingItem}
          style={{
            left: reaction.x,
            animationDuration: `${reaction.duration}ms`,
            "--wobble-amplitude": `${reaction.wobble}px`,
          } as React.CSSProperties}
        >
          <div className={styles.emojiWrap}>
            <Emoji unified={getUnified(reaction.emoji)} emojiStyle={EmojiStyle.APPLE} size={36} />
          </div>
          <span className={styles.floatingName}>{reaction.userName}</span>
        </div>
      ))}
    </div>
  );
});

FloatingReactions.displayName = "FloatingReactions";

/**
 * Best-effort conversion from an emoji character to its unified code point.
 * Falls back to rendering the raw character if conversion is not possible.
 */
function getUnified(emoji: string): string {
  try {
    return [...emoji]
      .map((c) => c.codePointAt(0)!.toString(16).padStart(4, "0"))
      .filter((hex) => hex !== "fe0f" || emoji.length <= 2) // keep variation selector only for single-char emoji
      .join("-");
  } catch {
    return "";
  }
}
