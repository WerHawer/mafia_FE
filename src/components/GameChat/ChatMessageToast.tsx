import classNames from "classnames";
import { Emoji, EmojiStyle } from "emoji-picker-react";
import noAvatar from "@/assets/images/noAvatar.jpg";
import { parseMessageToSegments } from "@/helpers/parseMessageToSegments.ts";
import { IMessage } from "@/types/message.types.ts";

import styles from "./ChatMessageToast.module.scss";

interface ChatMessageToastProps {
  message: IMessage;
}

export const ChatMessageToast = ({ message }: ChatMessageToastProps) => {
  const { text, sender, to } = message;
  const { nikName, avatar } = sender;

  const segments = parseMessageToSegments(text);
  const isDeadChat = "id" in to && to.id.endsWith("_dead");

  return (
    <div className={classNames(styles.toast, { [styles.dead]: isDeadChat })}>
      <img
        src={avatar || noAvatar}
        alt={nikName}
        className={styles.avatar}
      />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.senderName}>{nikName}</span>
          {isDeadChat && <span className={styles.deadIcon}>☠</span>}
        </div>
        <div className={styles.messageText}>
          {segments.map((segment, i) =>
            segment.type === "emoji" ? (
              <Emoji
                key={i}
                unified={segment.unified}
                emojiStyle={EmojiStyle.APPLE}
                size={26}
                lazyLoad
              />
            ) : (
              <span key={i}>{segment.value}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

ChatMessageToast.displayName = "ChatMessageToast";
