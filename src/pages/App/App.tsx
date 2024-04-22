import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import "./App.css";
import { wsEvents } from "@/config/wsEvents.ts";
import { usersStore } from "@/store/usersStore.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { messagesStore } from "@/store/messagesStore.ts";
import { IMessage, IMessageDTO, MessageTypes } from "@/types/message.types.ts";
import { useGetMessagesQueryWithStore } from "@/api/messages/queries.ts";

const App = observer(() => {
  const { sendMessage } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const { me: user, socketConnected } = usersStore;
  const { publicMessages, setNewLocalMessage } = messagesStore;
  useGetMessagesQueryWithStore();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [publicMessages]);

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
        <h4>{socketConnected} users connected to chat</h4>

        <div className="chatMessages" ref={chatRef}>
          {publicMessages?.map(
            ({
              text,
              id,
              sender: { id: userId, name: userName },
              createdAt,
            }) => (
              <p
                key={id ?? createdAt + userId}
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
    </div>
  );
});

export default App;
