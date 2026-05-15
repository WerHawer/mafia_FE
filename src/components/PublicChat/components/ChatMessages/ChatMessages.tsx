import { RefObject } from "react";

import { IMessage } from "@/types/message.types";

import styles from "../../PublicChat.module.scss";
import { ChatMessage } from "../ChatMessage";
import { ReactorLookup } from "../ChatMessage/MessageReactions";

interface ChatMessagesProps {
  messages: IMessage[];
  chatRef: RefObject<HTMLDivElement>;
  userId?: string;
  resolveUser: ReactorLookup;
  onToggleReaction: (messageId: string, emojiUnified: string) => void;
}

export const ChatMessages = ({
  messages,
  chatRef,
  userId,
  resolveUser,
  onToggleReaction,
}: ChatMessagesProps) => {
  return (
    <div className={styles.chatMessages} ref={chatRef}>
      {messages?.map((message) => (
        <ChatMessage
          key={message.id ?? message.createdAt + message.sender.id}
          message={message}
          isMyMessage={message.sender.id === userId}
          currentUserId={userId ?? ""}
          resolveUser={resolveUser}
          onToggleReaction={onToggleReaction}
        />
      ))}
    </div>
  );
};
