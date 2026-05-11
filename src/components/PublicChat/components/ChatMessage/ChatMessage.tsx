const APPLE_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";
import classNames from "classnames";
import { memo } from "react";

import { getEmojiVariant, EmojiVariant } from "@/helpers/getEmojiVariant.ts";
import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";
import { IMessage } from "@/types/message.types";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
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
          <img
            key={i}
            src={`${APPLE_CDN}${segment.unified}.png`}
            alt={segment.value}
            width={emojiSize}
            height={emojiSize}
            loading="lazy"
            decoding="async"
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
      <UserAvatar avatar={avatar} name={userName} className={styles.avatar} />
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
