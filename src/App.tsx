import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { SERVER } from './api/apiConstants.ts';
import { useSocket } from './hooks/useSocket.ts';
import { useUser } from './hooks/useUser.ts';
import { UserModal } from './UserModal.tsx';

export interface IUser {
  email: string;
  name: string;
  nikName?: string;
  friendList: [];
  isOnline: true;
  avatar?: string;
  id: string;
  // history: [],
}

type MessageTypes = 'user' | 'all' | 'room';

type To = {
  type: MessageTypes;
  id?: string;
};

export interface IMessageDTO {
  text: string;
  sender: string;
  to?: To;
  date: Date;
  isRead: boolean;
  id?: string;
}

export interface IMessage extends Omit<IMessageDTO, 'sender'> {
  sender: IUser;
}

axios.defaults.baseURL = SERVER;

function App() {
  const [count, setCount] = useState(0);
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const { user, users, setUser } = useUser();
  const { socket, userCount } = useSocket(user);

  useEffect(() => {
    if (!socket) return;

    socket.on('getAllMessages', (messages) => {
      setMessages(messages);
    });

    socket.on('chatMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });
  }, [socket]);

  const sendMessage = useCallback(() => {
    if (!newMessage || !user) return;

    const message: IMessage = {
      text: newMessage,
      sender: user,
      to: { type: 'all' },
      date: new Date(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...message, sender: user.id };

    setNewMessage('');
    setMessages((prev) => [...prev, message]);

    socket?.emit('chatMessage', messageDTO);
  }, [newMessage, socket, user]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, []);

  return (
    <div className="main_container">
      <UserModal setUser={setUser} users={users} user={user} />

      {user && <h3>Hello {user.name}</h3>}
      <div>
        <button onClick={() => i18n.changeLanguage('en')}>en</button>
        {'    '}
        <button onClick={() => i18n.changeLanguage('ua')}>ua</button>
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
                  userId === user?.id ? 'messageText myMessage' : 'messageText'
                }
              >
                <span className="strong">{userName}: </span>
                <span>{text}</span>
              </p>
            )
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
              onClick={sendMessage}
              disabled={!newMessage}
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p className="text-3xl font-bold underline">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        {t('Click on the Vite and React logos to learn more')}
        {'   '}
        {t('hello')}
      </p>
    </div>
  );
}

export default App;
