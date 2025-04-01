import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { useGetMessagesQueryWithStore } from "@/api/messages/queries";
import { wsEvents } from "@/config/wsEvents";
import { useSocket } from "@/hooks/useSocket";
import { messagesStore } from "@/store/messagesStore";
import { usersStore } from "@/store/usersStore";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types";

import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { ChatMessages } from "./components/ChatMessages";
import styles from "./PublicChat.module.scss";

export const PublicChat = observer(() => {
  useGetMessagesQueryWithStore();

  const [newMessage, setNewMessage] = useState("");
  const { sendMessage } = useSocket();
  const { socketConnected, me: user } = usersStore;
  const { publicMessages, setNewLocalMessage } = messagesStore;

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [publicMessages]);

  const onChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (!newMessage || !user) return;

    const message: IMessage = {
      text: newMessage,
      sender: user,
      createdAt: Date.now(),
      to: { type: MessageTypes.All },
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...message, sender: user.id };

    setNewMessage("");
    setNewLocalMessage(message);
    sendMessage(wsEvents.messageSend, messageDTO);
  }, [newMessage, sendMessage, user]);

  return (
    <div className={styles.chatContainer}>
      <ChatHeader socketConnected={socketConnected} />

      <ChatMessages
        messages={publicMessages}
        chatRef={chatRef}
        userId={user?.id}
      />

      <ChatInput
        value={newMessage}
        onChange={onChange}
        onSubmit={sendChatMessage}
      />
    </div>
  );
});

PublicChat.displayName = "PublicChat";
