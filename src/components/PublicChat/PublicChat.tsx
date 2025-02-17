import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types.ts";
import { useGetMessagesQueryWithStore } from "@/api/messages/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import styles from "./PublicChat.module.scss";
import noAvatar from "@/assets/images/noAvatar.jpg";
import { useTranslation } from "react-i18next";
import { Typography } from "@/UI/Typography";

export const PublicChat = observer(() => {
  const { t } = useTranslation();
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (e.shiftKey || e.ctrlKey) {
          return;
        }

        e.preventDefault();
        sendChatMessage();
      }
    },
    [sendChatMessage]
  );
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className={styles.chatContainer}>
      <Typography variant="span" className={styles.chatHeader}>
        <span className={styles.onlineIndicator} />
        {socketConnected} {t("online")}
      </Typography>

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
              <img
                src={avatar || noAvatar}
                alt={userName}
                className={styles.avatar}
              />
              <div className={styles.messageText}>
                <Typography variant="span" className={styles.strong}>
                  {userName}
                </Typography>
                <Typography variant="span">{text}</Typography>
              </div>
            </div>
          )
        )}
      </div>

      <div className={styles.chatInputContainer}>
        <form onSubmit={(e) => e.preventDefault()}>
          <textarea
            className={styles.chatInput}
            value={newMessage}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("typeMessage")}
            rows={1}
            style={{ height: "auto" }}
          />

          <button
            className={styles.sendButton}
            onClick={sendChatMessage}
            disabled={!newMessage}
            type="submit"
          >
            {t("send")}
          </button>
        </form>
      </div>
    </div>
  );
});

PublicChat.displayName = "PublicChat";
