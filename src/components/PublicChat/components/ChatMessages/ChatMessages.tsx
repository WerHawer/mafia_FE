import { RefObject } from "react";
import { IMessage } from "@/types/message.types";
import styles from "../../PublicChat.module.scss";
import { ChatMessage } from "../ChatMessage";

interface ChatMessagesProps {
  messages: IMessage[];
  chatRef: RefObject<HTMLDivElement>;
  userId?: string;
}

export const ChatMessages = ({
  messages,
  chatRef,
  userId,
}: ChatMessagesProps) => {
  return (
    <div className={styles.chatMessages} ref={chatRef}>
      {messages?.map((message) => (
        <ChatMessage
          key={message.id ?? message.createdAt + message.sender.id}
          message={message}
          isMyMessage={message.sender.id === userId}
        />
      ))}
    </div>
  );
};
