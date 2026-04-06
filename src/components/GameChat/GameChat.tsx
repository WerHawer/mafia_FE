import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { usersStore, messagesStore, isIDead } = rootStore;
  const { me: user } = usersStore;
  const { getMessages, setNewLocalMessage } = messagesStore;
  const { sendMessage } = useSocket();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"general" | "dead">("general");
  const [message, setMessage] = useState("");

  const currentRoomId = activeTab === "dead" ? `${id}_dead` : id;
  const messages = getMessages(currentRoomId);

  useGetMessagesQueryWithStore(id);
  useGetMessagesQueryWithStore(isIDead ? `${id}_dead` : "");

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
      to: { type: MessageTypes.Room, id: currentRoomId },
      createdAt: Date.now(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...newMessage, sender: user.id };

    setNewLocalMessage(newMessage);
    setMessage("");

    sendMessage(wsEvents.messageSend, messageDTO);
  }, [message, user, currentRoomId, setNewLocalMessage, sendMessage]);

  const isGeneralRestricted = activeTab === "general" && isIDead;

  return (
    <div className={styles.chatContainer}>
      <ChatMessages
        messages={messages || []}
        chatRef={chatRef}
        userId={user?.id}
      />

      <div className={styles.inputContainer}>
        {isGeneralRestricted ? (
          <div className={styles.deadNotice}>
            <span>☠</span>
            <span>{t("chat.deadRestriction")}</span>
          </div>
        ) : (
          <ChatInput
            value={message}
            onChange={handleChangeMessage}
            onSubmit={handleSendMessage}
          />
        )}
      </div>

      {isIDead && (
        <div className={styles.tabs}>
          <div
            className={classNames(styles.tab, {
              [styles.activeTab]: activeTab === "general",
            })}
            onClick={() => setActiveTab("general")}
          >
            {t("chat.general")}
          </div>
          <div
            className={classNames(styles.tab, {
              [styles.activeTab]: activeTab === "dead",
              [styles.deadTab]: true,
            })}
            onClick={() => setActiveTab("dead")}
          >
            {t("chat.dead")}
          </div>
        </div>
      )}
    </div>
  );
});

GameChat.displayName = "GameChat";
