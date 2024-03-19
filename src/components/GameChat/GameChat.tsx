import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { Input } from "../../UI/Input";
import styles from "./GameChat.module.scss";
import { Button } from "../../UI/Button";
import { ButtonVariant } from "../../UI/Button/Button.tsx";
import { SendOutlined } from "@ant-design/icons";
import { SocketContext, UserContext } from "../../context/SocketProvider.tsx";
import { wsEvents } from "../../config/wsEvents.ts";
import { IMessage, IMessageDTO, MessageTypes } from "../../types/message";

export const GameChat = () => {
  const { id = "" } = useParams();
  const user = useContext(UserContext);
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const containerHeight = containerRef.current?.clientHeight || 0;

  useEffect(() => {
    if (!socket) return;

    socket.on(wsEvents.messagesGetRoom, (messages: IMessage[]) => {
      setMessages(messages);
    });

    socket.on(wsEvents.messageSendPrivate, (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });
  }, [socket]);

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

    socket?.emit(wsEvents.messageSendPrivate, messageDTO);
  }, [socket, user, message, id]);

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
          type="submit"
          rounded
          className={styles.sendButton}
        >
          <SendOutlined className={styles.icon} />
        </Button>
      </form>
    </div>
  );
};
