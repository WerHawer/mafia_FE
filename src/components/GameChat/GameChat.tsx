import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "../../UI/Input";
import styles from "./GameChat.module.scss";
import { Button } from "../../UI/Button";
import { SendOutlined } from "@ant-design/icons";
import { useSocket } from "../../context/SocketProvider.tsx";
import { wsEvents } from "../../config/wsEvents.ts";
import { IMessage, IMessageDTO, MessageTypes } from "../../types/message";
import { ButtonType, ButtonVariant } from "../../UI/Button/ButtonTypes.ts";
import { userStore } from "../../store/mobx/userStore.ts";
import { observer } from "mobx-react-lite";

export const GameChat = observer(() => {
  const { id = "" } = useParams();
  const { me: user } = userStore;
  const { subscribe, sendMessage } = useSocket();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const containerHeight = containerRef.current?.clientHeight || 0;

  useEffect(() => {
    const unsubscribeGetMessages = subscribe(
      wsEvents.messagesGetRoom,
      (messages: IMessage[]) => {
        setMessages(messages);
      },
    );

    const unsubscribePrivateMessage = subscribe(
      wsEvents.messageSendPrivate,
      (message: IMessage) => {
        setMessages((prev) => [...prev, message]);
      },
    );

    return () => {
      unsubscribeGetMessages();
      unsubscribePrivateMessage();
    };
  }, [subscribe]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleChangeMessage = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    [],
  );

  const handleSendMessage = useCallback(() => {
    if (!message || !user) return;

    const newMessage: IMessage = {
      text: message,
      sender: user,
      to: { type: MessageTypes.Room, id },
      date: new Date(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...newMessage, sender: user.id };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    sendMessage(wsEvents.messageSendPrivate, messageDTO);
  }, [message, user, id, sendMessage]);

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
        {!!messages.length &&
          messages.map(({ sender, text }, index) => {
            return (
              <div key={sender.id + index} className={styles.messageText}>
                <p>{sender.name}:</p>
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
