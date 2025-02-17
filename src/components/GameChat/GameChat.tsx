import { useGetMessagesQueryWithStore } from "@/api/messages/queries.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types.ts";
import { Button } from "@/UI/Button";
import { ButtonType, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Input } from "@/UI/Input";
import { SendOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const containerHeight = containerRef.current?.clientHeight || 0;

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleChangeMessage = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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
    <div className={styles.container} ref={containerRef}>
      <div
        className={styles.messages}
        style={{
          maxHeight: `${containerHeight}px`,
          height: `${containerHeight}px`,
        }}
        ref={chatRef}
      >
        {messages?.map(({ sender, text, id }, index) => {
          return (
            <div key={id ?? sender.id + index} className={styles.messageText}>
              <p>{sender.nikName}:</p>
              <p>{text}</p>
            </div>
          );
        })}
      </div>
      <form
        className={styles.inputContainer}
        onSubmit={(e) => e.preventDefault()}
      >
        <Input value={message} onChange={handleChangeMessage} />

        <Button
          variant={ButtonVariant.Secondary}
          onClick={handleSendMessage}
          type={ButtonType.Submit}
          rounded
          className={styles.sendButton}
        >
          <SendOutlined className={styles.icon} />
        </Button>
      </form>
    </div>
  );
});

GameChat.displayName = "GameChat";
