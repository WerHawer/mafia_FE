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
import { Button } from "@/UI/Button/Button.tsx";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";

import { ChatInput } from "../PublicChat/components/ChatInput";
import { ChatMessages } from "../PublicChat/components/ChatMessages";
import styles from "./GameChat.module.scss";

enum ChatTab {
  General = "general",
  Dead = "dead",
}

export const GameChat = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, messagesStore, isIDead, isIGM } = rootStore;
  const { me: user } = usersStore;
  const { getMessages, setNewLocalMessage } = messagesStore;
  const { sendMessage } = useSocket();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ChatTab>(ChatTab.General);
  const [message, setMessage] = useState("");

  const currentRoomId = activeTab === ChatTab.Dead ? `${id}_dead` : id;
  const messages = getMessages(currentRoomId);

  // Load general chat always
  useGetMessagesQueryWithStore(id, !!id);
  // Load dead chat for dead players AND for GM (observer mode)
  const shouldLoadDeadChat = isIDead || isIGM;
  useGetMessagesQueryWithStore(`${id}_dead`, shouldLoadDeadChat && !!id);

  useEffect(() => {
    if (shouldLoadDeadChat && user?.id) {
      sendMessage(wsEvents.roomConnection, [`${id}_dead`, user.id]);
    }
  }, [shouldLoadDeadChat, id, user?.id, sendMessage]);

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

  const isGeneralRestricted = activeTab === ChatTab.General && isIDead;

  return (
    <div className={styles.chatContainer}>
      <ChatMessages
        messages={messages || []}
        chatRef={chatRef}
        userId={user?.id}
      />

      <div className={styles.inputContainer}>
        {isGeneralRestricted && (
          <div className={styles.deadNotice}>
            <span>☠</span>
            <span>{t("chat.deadRestriction")}</span>
          </div>
        )}
        {!isGeneralRestricted && (
          <ChatInput
            value={message}
            onChange={handleChangeMessage}
            onSubmit={handleSendMessage}
          />
        )}
      </div>

      {(isIDead || isIGM) && (
        <div className={styles.tabs}>
          <Button
            variant={activeTab === ChatTab.General ? ButtonVariant.Outline : ButtonVariant.Tertiary}
            size={ButtonSize.Small}
            onClick={() => setActiveTab(ChatTab.General)}
            className={classNames(styles.tab, {
              [styles.inactiveTab]: activeTab !== ChatTab.General,
            })}
          >
            {t("chat.general")}
          </Button>

          <Button
            variant={activeTab === ChatTab.Dead ? ButtonVariant.Error : ButtonVariant.Tertiary}
            size={ButtonSize.Small}
            onClick={() => setActiveTab(ChatTab.Dead)}
            className={classNames(styles.tab, {
              [styles.inactiveTab]: activeTab !== ChatTab.Dead,
            })}
          >
            {t("chat.dead")}
          </Button>
        </div>
      )}
    </div>
  );
});

GameChat.displayName = "GameChat";
