import classNames from "classnames";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
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
import { ChatMessageToast } from "./ChatMessageToast";
import styles from "./GameChat.module.scss";

enum ChatTab {
  General = "general",
  Dead = "dead",
}

export const GameChat = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, messagesStore, gamesStore, isIDead, isIGM } = rootStore;
  const { me: user } = usersStore;
  const { getMessages, setNewLocalMessage } = messagesStore;
  const { sendMessage, subscribe } = useSocket();
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

  const { isStarted } = gamesStore.gameFlow;

  useEffect(() => {
    if ((!isStarted && !isIGM) || (!shouldLoadDeadChat && activeTab === ChatTab.Dead)) {
      setActiveTab(ChatTab.General);
    }
  }, [isStarted, shouldLoadDeadChat, activeTab, isIGM]);

  const chatRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevTab = useRef(activeTab);

  // Reset instant-scroll flag when switching tabs
  if (prevTab.current !== activeTab) {
    isInitialLoad.current = true;
    prevTab.current = activeTab;
  }

  const [chatToasts, setChatToasts] = useState<{ id: string; msg: IMessage }[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.messageSend, (msg: IMessage) => {
      // Check if message belongs to any channel the user is subscribed to in this game
      const toId = "id" in msg.to ? msg.to.id : undefined;
      const isForGeneral = toId === id;
      const isForDead = toId === `${id}_dead`;
      const isForGame = msg.to.type === MessageTypes.All || isForGeneral || (shouldLoadDeadChat && isForDead);
      
      if (msg.sender?.id !== user?.id && isForGame) {
        const toastId = `chat-msg-${msg.createdAt}-${msg.sender?.id}-${Math.random()}`;
        
        setChatToasts((prev) => [...prev, { id: toastId, msg }]);

        // Auto-remove after 2.5 seconds
        setTimeout(() => {
          setChatToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 2500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, id, shouldLoadDeadChat, user?.id]);

  useEffect(() => {
    if (!chatRef.current || !messages?.length) return;

    const behavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior,
    });
  }, [messages]);

  useEffect(() => {
    if (!chatRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: isInitialLoad.current ? "instant" : "smooth",
      });
    });

    resizeObserver.observe(chatRef.current);

    return () => resizeObserver.disconnect();
  }, []);

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
      <div className={styles.toasterContainer}>
        <AnimatePresence>
          {chatToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={styles.toastWrapper}
            >
              <ChatMessageToast message={toast.msg} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
