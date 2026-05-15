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
import { SoundEffect } from "@/store/soundStore.ts";
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

const TOAST_DURATION_MS = 2500;

export const GameChat = observer(() => {
  const { id = "" } = useParams();
  const { usersStore, messagesStore, gamesStore, isIDead, isIGM, soundStore } = rootStore;
  const { me: user } = usersStore;
  const { getMessages, setNewLocalMessage } = messagesStore;
  const { sendMessage, subscribe } = useSocket();

  const resolveUser = useCallback((userId: string) => {
    const u = usersStore.getUser(userId);
    return u ? { nikName: u.nikName, avatar: u.avatar ?? null } : null;
  }, []);
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
  const isAtBottomRef = useRef(true);
  const prevTab = useRef(activeTab);

  // Reset scroll flags when switching tabs
  if (prevTab.current !== activeTab) {
    isInitialLoad.current = true;
    isAtBottomRef.current = true;
    prevTab.current = activeTab;
  }

  const [chatToasts, setChatToasts] = useState<{ id: string; msg: IMessage }[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.messageSend, (msg: IMessage) => {
      const toId = "id" in msg.to ? msg.to.id : undefined;

      // Determine message destination
      const isForGeneral = toId === id;
      const isForDead = toId?.endsWith("_dead") && toId.includes(id);

      // Check if user has access and if the message is from another tab
      const canSeeMessage = msg.to.type === MessageTypes.All || isForGeneral || ((isIDead || isIGM) && isForDead);
      const isNotCurrentTab = toId !== currentRoomId;

      const isGeneralChat = msg.to.type === MessageTypes.All;
      if (msg.sender?.id !== user?.id && canSeeMessage && isNotCurrentTab && !isGeneralChat) {
        const toastId = `chat-msg-${msg.createdAt}-${msg.sender?.id}-${Math.random()}`;

        setChatToasts((prev) => {
          const next = [...prev, { id: toastId, msg }];
          if (next.length > 3) {
            return next.slice(1);
          }
          return next;
        });

        if (!soundStore.isChatNotificationMuted) {
          soundStore.playSfx(SoundEffect.Notification);
        }

        // Auto-remove after the toast's lifetime
        setTimeout(() => {
          setChatToasts((prev) => prev.filter((toast) => toast.id !== toastId));
        }, TOAST_DURATION_MS);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, id, isIDead, isIGM, user?.id, currentRoomId, soundStore]);

  // Track scroll position — disable auto-scroll when user scrolled up
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      isAtBottomRef.current = dist <= 100;
      setShowScrollBtn(dist > 100);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Reset scroll button visibility on tab switch
  useEffect(() => {
    setShowScrollBtn(false);
  }, [activeTab]);

  // Auto-scroll when messages update — only if at bottom
  useEffect(() => {
    if (!chatRef.current || !messages?.length) return;
    if (!isAtBottomRef.current && !isInitialLoad.current) return;

    const behavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior });
  }, [messages]);

  // Keep at bottom when container resizes (e.g. input expands)
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: isInitialLoad.current ? "instant" : "smooth",
        });
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  // Subscribe to server reaction echo — uses payload.roomId to patch the correct message list
  useEffect(() => {
    return subscribe(wsEvents.messageReactionToggle, (payload) => {
      messagesStore.patchMessageReactions(payload.roomId, payload.messageId, payload.reactions);
    });
  }, [subscribe]);

  const handleToggleReaction = useCallback(
    (messageId: string, emojiUnified: string) => {
      if (!user) return;
      messagesStore.toggleReactionLocal(currentRoomId, messageId, emojiUnified, user.id);
      sendMessage(wsEvents.messageReactionToggle, {
        messageId,
        roomId: currentRoomId,
        emojiUnified,
        userId: user.id,
      });
    },
    [user, currentRoomId, sendMessage]
  );

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

  const scrollToBottom = useCallback(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setChatToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

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
              <ChatMessageToast
                message={toast.msg}
                duration={TOAST_DURATION_MS}
                sfxMuted={soundStore.isChatNotificationMuted}
                onToggleSfx={() => soundStore.toggleChatNotificationMute()}
                onDismiss={() => dismissToast(toast.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.messagesArea}>
        <ChatMessages
          messages={messages || []}
          chatRef={chatRef}
          userId={user?.id}
          resolveUser={resolveUser}
          onToggleReaction={handleToggleReaction}
        />

        {showScrollBtn && (
          <button
            className={styles.scrollBtn}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3v8M4 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

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
