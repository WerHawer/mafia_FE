import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useGetMessagesQueryWithStore } from "@/api/messages/queries.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types.ts";

import { ChatInput } from "../PublicChat/components/ChatInput";
import { ChatMessages } from "../PublicChat/components/ChatMessages";
import styles from "./GameChat.module.scss";

export const GameChat = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, messagesStore } = rootStore;
  const { me: user } = usersStore;
  const { getMessages, setNewLocalMessage } = messagesStore;
  const messages = getMessages(id);
  const { sendMessage } = useSocket();
  const [message, setMessage] = useState("");
  useGetMessagesQueryWithStore(id);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleChangeMessage = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const handleSendMessage = useCallback(() => {
    if (!message || !user) return;

    const newMessage: IMessage = {
      text: message,
      sender: user,
      to: { type: MessageTypes.Room, id },
      createdAt: Date.now(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...newMessage, sender: user.id };

    setNewLocalMessage(newMessage);
    setMessage("");

    sendMessage(wsEvents.messageSend, messageDTO);
  }, [message, user, id, setNewLocalMessage, sendMessage]);

  return (
    <div className={styles.chatContainer}>
      <ChatMessages
        messages={messages || []}
        chatRef={chatRef}
        userId={user?.id}
      />

      <div className={styles.inputContainer}>
        <ChatInput
          value={message}
          onChange={handleChangeMessage}
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  );
});

GameChat.displayName = "GameChat";
