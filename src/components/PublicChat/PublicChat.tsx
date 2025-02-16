import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types.ts";
import { useGetMessagesQueryWithStore } from "@/api/messages/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import styles from "./PublicChat.module.scss";
import noAvatar from "@/assets/images/noAvatar.jpg";

export const PublicChat = observer(() => {
  const { sendMessage } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const { usersStore, messagesStore } = rootStore;
  const { me: user, socketConnected } = usersStore;
  const { publicMessages, setNewLocalMessage } = messagesStore;

  useGetMessagesQueryWithStore();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [publicMessages]);

  const sendChatMessage = useCallback(() => {
    if (!newMessage || !user) return;

    const message: IMessage = {
      text: newMessage,
      sender: user,
      to: { type: MessageTypes.All },
      createdAt: Date.now(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...message, sender: user.id };

    setNewMessage("");
    setNewLocalMessage(message);
    sendMessage(wsEvents.messageSend, messageDTO);
  }, [newMessage, sendMessage, setNewLocalMessage, user]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  return (
    <div className={styles.chatContainer}>
      <h4 className={styles.chatHeader}>
        {socketConnected} users connected to chat
      </h4>

      <div className={styles.chatMessages} ref={chatRef}>
        {publicMessages?.map(
          ({
            text,
            id,
            sender: { id: userId, nikName: userName, avatar },
            createdAt,
          }) => (
            <div
              key={id ?? createdAt + userId}
              className={`${styles.messageWrapper} ${
                userId === user?.id ? styles.myMessage : ""
              }`}
            >
              {userId !== user?.id && (
                <img
                  src={avatar || noAvatar}
                  alt={userName}
                  className={styles.avatar}
                />
              )}
              <div className={styles.messageText}>
                <span className={styles.strong}>{userName}</span>
                <span>{text}</span>
              </div>
              {userId === user?.id && (
                <img
                  src={avatar || noAvatar}
                  alt={userName}
                  className={styles.avatar}
                />
              )}
            </div>
          )
        )}
      </div>

      <div className={styles.chatInputContainer}>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            className={styles.chatInput}
            value={newMessage}
            onChange={handleChange}
            placeholder="Type a message..."
          />
          <button
            className={styles.sendButton}
            onClick={sendChatMessage}
            disabled={!newMessage}
            type="submit"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
});

PublicChat.displayName = "PublicChat";
