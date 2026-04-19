import { Emoji, EmojiStyle } from "emoji-picker-react";
import { observer } from "mobx-react-lite";

import styles from "./GameReactions.module.scss";

interface GameReactionsBarProps {
  sendReaction: (emoji: string) => void;
}

// unified codes matching: 👍 👎 😇 😈 😂 😢 🤔 👏 ❤️
const REACTIONS = [
  { unified: "1f44d", emoji: "👍" },
  { unified: "1f44e", emoji: "👎" },
  { unified: "1f607", emoji: "😇" },
  { unified: "1f608", emoji: "😈" },
  { unified: "1f602", emoji: "😂" },
  { unified: "1f622", emoji: "😢" },
  { unified: "1f914", emoji: "🤔" },
  { unified: "1f44f", emoji: "👏" },
  { unified: "2764-fe0f", emoji: "❤️" },
];

/**
 * Horizontal bar with emoji reaction buttons.
 * Displayed at the bottom-center of the video area.
 */
export const GameReactionsBar = observer(({ sendReaction }: GameReactionsBarProps) => {
  return (
    <div className={styles.bar}>
      {REACTIONS.map(({ unified, emoji }) => (
        <button
          key={unified}
          className={styles.reactionBtn}
          onClick={() => sendReaction(emoji)}
        >
          <Emoji unified={unified} emojiStyle={EmojiStyle.APPLE} size={26} />
        </button>
      ))}
    </div>
  );
});

GameReactionsBar.displayName = "GameReactionsBar";
