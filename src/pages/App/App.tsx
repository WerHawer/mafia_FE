import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import "./App.css";
import { useSocket } from "../../context/SocketProvider.tsx";
import { wsEvents } from "../../config/wsEvents.ts";
import { routes } from "../../router/routs.ts";
import { IMessage, IMessageDTO, MessageTypes } from "../../types/message";
import { userStore } from "../../store/mobx/userStore.ts";

const App = observer(() => {
  const { t, i18n } = useTranslation();
  const { subscribe, sendMessage } = useSocket();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userCount, setUserCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const { me: user } = userStore;

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    sendMessage(wsEvents.messagesGetAll);
    sendMessage(wsEvents.userConnectedCount);

    const unsubscribeAllMessages = subscribe(
      wsEvents.messagesGetAll,
      (messages: IMessage[]) => setMessages(messages),
    );
    const unsubscribeIncoming = subscribe(
      wsEvents.messageSend,
      (message: IMessage) => setMessages((prev) => [...prev, message]),
    );
    const unsubscribeCount = subscribe(
      wsEvents.userConnectedCount,
      (usersCount: number) => setUserCount(usersCount),
    );

    return () => {
      unsubscribeAllMessages();
      unsubscribeIncoming();
      unsubscribeCount();
    };
  }, [sendMessage, subscribe]);

  const sendChatMessage = useCallback(() => {
    if (!newMessage || !user) return;

    const message: IMessage = {
      text: newMessage,
      sender: user,
      to: { type: MessageTypes.All },
      date: new Date(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...message, sender: user.id };

    setNewMessage("");
    setMessages((prev) => [...prev, message]);

    sendMessage(wsEvents.messageSend, messageDTO);
  }, [newMessage, sendMessage, user]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  return (
    <div className="main_container">
      {user && <h3>Hello {user.name}</h3>}
      <div>
        <button onClick={() => i18n.changeLanguage("en")}>en</button>
        {"    "}
        <button onClick={() => i18n.changeLanguage("ua")}>ua</button>
      </div>

      <h2>{i18n.language}</h2>

      <div className="chatContainer">
        <h4>{userCount} users connected to chat</h4>

        <div className="chatMessages" ref={chatRef}>
          {messages.map(
            ({ text, sender: { id: userId, name: userName } }, index) => (
              <p
                key={userId + index}
                className={
                  userId === user?.id ? "messageText myMessage" : "messageText"
                }
              >
                <span className="strong">{userName}: </span>
                <span>{text}</span>
              </p>
            ),
          )}
        </div>

        <div className="chatInputContainer">
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              className="chatInput"
              value={newMessage}
              onChange={handleChange}
            />
            <button
              className="sendButton"
              onClick={sendChatMessage}
              disabled={!newMessage}
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <Link to={routes.video}>Video Chat</Link>

        <p className="text-3xl font-bold underline">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        {"Click on the Vite and React logos to learn more"}
        {"   "}
        {t("hello")}
      </p>
    </div>
  );
});

export default App;
