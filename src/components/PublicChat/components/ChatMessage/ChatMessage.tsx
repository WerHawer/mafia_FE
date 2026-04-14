import { Emoji } from "emoji-picker-react";
import { EmojiStyle } from "emoji-picker-react";
import classNames from "classnames";
import { memo } from "react";

import noAvatar from "@/assets/images/noAvatar.jpg";
import { getEmojiVariant, EmojiVariant } from "@/helpers/getEmojiVariant.ts";
import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";
import { IMessage } from "@/types/message.types";
import { Typography } from "@/UI/Typography";

import styles from "../../PublicChat.module.scss";

interface ChatMessageProps {
  message: IMessage;
  isMyMessage: boolean;
}

// Emoji display size (px) per variant
const EMOJI_SIZE_MAP: Record<EmojiVariant, number> = {
  single: 60,
  few: 36,
  text: 18,
};

const MessageText = memo(({ text, emojiSize }: { text: string; emojiSize: number }) => {
  const segments = parseMessageToSegments(text);

  return (
    // Single span wrapper → becomes ONE flex child of the column-flex .messageText container.
    // Without it, each segment (img/span) would be a separate flex row.
    <span className={styles.messageContent}>
      {segments.map((segment, i) =>
        segment.type === "emoji" ? (
          <Emoji
            key={i}
            unified={segment.unified}
            emojiStyle={EmojiStyle.APPLE}
            size={emojiSize}
            lazyLoad
          />
        ) : (
          <span key={i}>{segment.value}</span>
        )
      )}
    </span>
  );
});

MessageText.displayName = "MessageText";

export const ChatMessage = ({ message, isMyMessage }: ChatMessageProps) => {
  const {
    text,
    sender: { nikName: userName, avatar },
  } = message;

  const emojiVariant = getEmojiVariant(text);
  const isEmojiOnly = emojiVariant !== "text";
  const emojiSize = EMOJI_SIZE_MAP[emojiVariant];

  return (
    <div
      className={classNames(styles.messageWrapper, {
        [styles.myMessage]: isMyMessage,
      })}
    >
      <img src={avatar || noAvatar} alt={userName} className={styles.avatar} />
      <div
        className={classNames(styles.messageText, {
          [styles.emojiSingle]: emojiVariant === "single",
          [styles.emojiFew]: emojiVariant === "few",
        })}
      >
        {!isEmojiOnly && (
          <Typography variant="span" className={styles.strong}>
            {userName}
          </Typography>
        )}
        <MessageText text={text} emojiSize={emojiSize} />
      </div>
    </div>
  );
};
