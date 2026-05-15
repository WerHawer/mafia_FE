const APPLE_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";
import classNames from "classnames";
import { memo, useCallback, useMemo, useRef } from "react";

import { getEmojiVariant, EmojiVariant } from "@/helpers/getEmojiVariant.ts";
import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";
import { IMessage } from "@/types/message.types";
import { UserAvatar } from "@/UI/Avatar/UserAvatar.tsx";
import { Typography } from "@/UI/Typography";

import { MessageReactions, ReactorLookup } from "./MessageReactions";
import styles from "../../PublicChat.module.scss";

interface ChatMessageProps {
  message: IMessage;
  isMyMessage: boolean;
  currentUserId: string;
  resolveUser: ReactorLookup;
  onToggleReaction: (messageId: string, emojiUnified: string) => void;
}

// Emoji display size (px) per variant
const EMOJI_SIZE_MAP: Record<EmojiVariant, number> = {
  single: 60,
  few: 36,
  text: 18,
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

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

export const ChatMessage = ({
  message,
  isMyMessage,
  currentUserId,
  resolveUser,
  onToggleReaction,
}: ChatMessageProps) => {
  const {
    text,
    id: messageId,
    createdAt,
    reactions,
    sender: { nikName: userName, avatar },
  } = message;

  const emojiVariant = getEmojiVariant(text);
  const isEmojiOnly = emojiVariant !== "text";
  const emojiSize = EMOJI_SIZE_MAP[emojiVariant];

  const bubbleRef = useRef<HTMLDivElement>(null);
  const closePickerRef = useRef<(() => void) | null>(null);
  const timeStr = useMemo(() => formatTime(createdAt), [createdAt]);

  const handleToggle = useCallback(
    (emojiUnified: string) => {
      if (!messageId) return;
      onToggleReaction(messageId, emojiUnified);
    },
    [messageId, onToggleReaction]
  );

  return (
    <div
      className={classNames(styles.messageWrapper, {
        [styles.myMessage]: isMyMessage,
      })}
    >
      <UserAvatar avatar={avatar} name={userName} className={styles.avatar} />
      <div
        ref={bubbleRef}
        className={classNames(styles.messageText, {
          [styles.emojiSingle]: emojiVariant === "single",
          [styles.emojiFew]: emojiVariant === "few",
        })}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => { if (e.detail >= 2) e.preventDefault(); }}
        onDoubleClick={(e) => { e.stopPropagation(); closePickerRef.current?.(); handleToggle("2764-fe0f"); }}
      >
        {!isEmojiOnly && (
          <div className={styles.messageHeader}>
            <Typography variant="span" className={styles.strong}>
              {userName}
            </Typography>
            <span className={styles.timestamp}>{timeStr}</span>
          </div>
        )}
        <MessageText text={text} emojiSize={emojiSize} />
        {!isEmojiOnly && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            isMine={isMyMessage}
            resolveUser={resolveUser}
            onToggle={handleToggle}
            hoverTargetRef={bubbleRef}
            closePickerRef={closePickerRef}
          />
        )}
      </div>
    </div>
  );
};
