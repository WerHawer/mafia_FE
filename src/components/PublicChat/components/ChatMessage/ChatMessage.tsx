import classNames from "classnames";

import noAvatar from "@/assets/images/noAvatar.jpg";
import { IMessage } from "@/types/message.types";
import { Typography } from "@/UI/Typography";

import styles from "../../PublicChat.module.scss";

interface ChatMessageProps {
  message: IMessage;
  isMyMessage: boolean;
}

export const ChatMessage = ({ message, isMyMessage }: ChatMessageProps) => {
  const {
    text,
    sender: { nikName: userName, avatar },
  } = message;

  return (
    <div
      className={classNames(styles.messageWrapper, {
        [styles.myMessage]: isMyMessage,
      })}
    >
      <img src={avatar || noAvatar} alt={userName} className={styles.avatar} />
      <div className={styles.messageText}>
        <Typography variant="span" className={styles.strong}>
          {userName}
        </Typography>
        <Typography variant="span">{text}</Typography>
      </div>
    </div>
  );
};
