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

// Distance from bottom (px) at which auto-scroll is active and the button hides
const SCROLL_THRESHOLD = 100;

export const PublicChat = observer(() => {
  useGetMessagesQueryWithStore();

  const [newMessage, setNewMessage] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { sendMessage, subscribe } = useSocket();
  const { me: user } = usersStore;
  const { publicMessages, setNewLocalMessage } = messagesStore;

  const chatRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  // true = user is at (or near) the bottom → auto-scroll enabled
  const isAtBottomRef = useRef(true);

  // Track scroll position to enable/disable auto-scroll and show the button
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      isAtBottomRef.current = dist <= SCROLL_THRESHOLD;
      setShowScrollBtn(dist > SCROLL_THRESHOLD);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll when messages update — only if user is at the bottom
  useEffect(() => {
    if (!chatRef.current || !publicMessages?.length) return;
    if (!isAtBottomRef.current && !isInitialLoad.current) return;

    const behavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior });
  }, [publicMessages]);

  // Keep scroll at bottom when the container resizes (e.g. emoji picker opens)
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

  const scrollToBottom = useCallback(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  // Subscribe to server reaction echo and reconcile with optimistic state
  useEffect(() => {
    return subscribe(wsEvents.messageReactionToggle, (payload) => {
      messagesStore.patchMessageReactions("public", payload.messageId, payload.reactions);
    });
  }, [subscribe]);

  const resolveUser = useCallback((userId: string) => {
    const u = usersStore.getUser(userId);
    return u ? { nikName: u.nikName, avatar: u.avatar ?? null } : null;
  }, []);

  const handleToggleReaction = useCallback(
    (messageId: string, emojiUnified: string) => {
      if (!user) return;
      messagesStore.toggleReactionLocal("public", messageId, emojiUnified, user.id);
      sendMessage(wsEvents.messageReactionToggle, {
        messageId,
        roomId: "public",
        emojiUnified,
        userId: user.id,
      });
    },
    [user, sendMessage]
  );

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
      <ChatHeader />

      <div className={styles.messagesArea}>
        <ChatMessages
          messages={publicMessages}
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

      <ChatInput
        value={newMessage}
        onChange={onChange}
        onSubmit={sendChatMessage}
      />
    </div>
  );
});

PublicChat.displayName = "PublicChat";
