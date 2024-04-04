import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import "./App.css";
import { wsEvents } from "../../config/wsEvents.ts";
import { routes } from "../../router/routs.ts";
import { IMessage, IMessageDTO, MessageTypes } from "../../types/message";
import { usersStore } from "../../store/usersStore.ts";
import { useSocket } from "../../hooks/useSocket.ts";
import { useGetAllMessages } from "../../api/messages/queries.ts";
import { messagesStore } from "../../store/messagesStore.ts";

const App = observer(() => {
  const { t } = useTranslation();
  const { subscribe, sendMessage } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const [userCount, setUserCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const { me: user } = usersStore;
  const {
    publicMessages,
    setNewMessage: setNewMessageToStore,
    setNewLocalMessage,
  } = messagesStore;
  useGetAllMessages();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [publicMessages]);

  useEffect(() => {
    sendMessage(wsEvents.userConnectedCount);

    const unsubscribeIncoming = subscribe(wsEvents.messageSend, (message) =>
      setNewMessageToStore(message),
    );

    const unsubscribeCount = subscribe(
      wsEvents.userConnectedCount,
      (usersCount) => setUserCount(usersCount),
    );

    return () => {
      unsubscribeIncoming();
      unsubscribeCount();
    };
  }, [sendMessage, setNewMessageToStore, subscribe]);

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

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  return (
    <div className="main_container">
      {user && <h3>Hello {user.name}</h3>}

      <div className="chatContainer">
        <h4>{userCount} users connected to chat</h4>

        <div className="chatMessages" ref={chatRef}>
          {publicMessages?.map(
            ({ text, sender: { id: userId, name: userName }, createdAt }) => (
              <p
                key={createdAt}
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
