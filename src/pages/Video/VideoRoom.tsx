import { useParams } from 'react-router-dom';
import './video.css';
import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePeer } from '../../hooks/usePeer.ts';
import Peer from 'peerjs';
import { useUserMediaStream } from '../../hooks/useUserMediaStream.ts';
import { SocketContext, UserContext } from '../../context/SocketProvider.tsx';
import { wsEvents } from '../../config/wsEvents.ts';
import { IMessage, IMessageDTO } from '../../types/message';

type UserStreams = Record<string, MediaStream>;

export const VideoRoom = () => {
  const { id = '' } = useParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState('');
  const [streams, setStreams] = useState<UserStreams>({});
  const user = useContext(UserContext);
  const socket = useContext(SocketContext);

  const chatRef = useRef<HTMLDivElement>(null);

  const userMediaStream = useUserMediaStream(
    {
      audio: true,
      video: true,
    },
    !!user
  );

  const { peer, peerId } = usePeer(userMediaStream?.id);

  const addVideoStream = useCallback((stream: MediaStream) => {
    setStreams((prev) => ({ ...prev, [stream.id]: stream }));
  }, []);

  const removeVideoStream = useCallback((id: string) => {
    setStreams((prev) => {
      if (!prev[id]) return prev;

      const newStreams = { ...prev };
      delete newStreams[id];

      return newStreams;
    });
  }, []);

  const connectToNewUser = useCallback(
    (
      otherUserId: string,
      stream: MediaStream,
      peer: Peer,
      cb: (userMediaStream: MediaStream) => void
    ) => {
      const call = peer.call(otherUserId, stream);

      call.on('stream', (userMediaStream) => {
        cb(userMediaStream);
      });

      return call;
    },
    []
  );

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!peerId || !socket || !userMediaStream) return;

    socket.emit(wsEvents.roomConnection, id, peerId, userMediaStream.id);

    socket.on(wsEvents.messagesGetRoom, (messages: IMessage[]) => {
      setMessages(messages);
    });

    socket.on(wsEvents.messageSendPrivate, (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on(wsEvents.peerDisconnect, (userId: string) => {
      removeVideoStream(userId);
    });
  }, [id, peerId, removeVideoStream, socket, userMediaStream]);

  // add my video stream
  useEffect(() => {
    if (!userMediaStream) return;

    addVideoStream(userMediaStream);
  }, [userMediaStream, addVideoStream]);

  // add user who already in room to me when I connect.
  useEffect(() => {
    if (!peer || !socket || !userMediaStream) return;

    peer.on('call', (call) => {
      call.answer(userMediaStream);

      call.on('stream', (userVideoStream) => {
        addVideoStream(userVideoStream);
      });
    });
  }, [addVideoStream, connectToNewUser, peer, peerId, socket, userMediaStream]);

  // add new user when he connects to room
  useEffect(() => {
    if (!socket || !userMediaStream || !peer) return;

    socket.on(wsEvents.roomConnection, (otherUserId) => {
      const connectCb = (userVideoStream: MediaStream) => {
        addVideoStream(userVideoStream);
      };

      connectToNewUser(otherUserId, userMediaStream, peer, connectCb);
    });
  }, [addVideoStream, connectToNewUser, peer, socket, userMediaStream]);

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
      to: { type: 'room', id },
      date: new Date(),
      isRead: false,
    };

    const messageDTO: IMessageDTO = { ...newMessage, sender: user.id };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    socket?.emit(wsEvents.messageSendPrivate, messageDTO);
  }, [socket, user, message, id]);

  return (
    <>
      <div className="header">
        <div className="video_logo">
          <h3>Video Chat {id}</h3>
        </div>
      </div>
      <div className="main">
        <div className="main__left">
          <div className="videos__group">
            <div id="video-grid">
              {!!Object.values(streams).length &&
                Object.values(streams).map((stream) => {
                  return (
                    <video
                      key={stream.id}
                      data-id={stream.id}
                      className="video"
                      playsInline
                      autoPlay
                      muted={stream.id === userMediaStream?.id}
                      ref={(video) => {
                        if (video) {
                          video.srcObject = stream;
                        }
                      }}
                    />
                  );
                })}
            </div>
          </div>
          <div className="options">
            <div className="options__left">
              <button
                id="stopVideo"
                className="options__button background__red"
              >
                <i className="fa fa-video-camera">V</i>
              </button>
              <button id="muteButton" className="options__button">
                <i className="fa fa-microphone">M</i>
              </button>
            </div>
            <div className="options__right">
              <button id="inviteButton" className="options__button">
                <i className="fas fa-user-plus">+</i>
              </button>
            </div>
          </div>
        </div>
        <div className="main__right">
          <div className="main__chat_window" ref={chatRef}>
            <div className="messages">
              {!!messages.length &&
                messages.map(({ sender, text }, index) => {
                  return (
                    <div key={sender.id + index} className="message">
                      <p>{sender.name}:</p>
                      <p>{text}</p>
                    </div>
                  );
                })}
            </div>
          </div>
          <form
            id="chat_form"
            onSubmit={(e) => e.preventDefault()}
            className="main__message_container"
          >
            <input
              id="chat_message"
              type="text"
              autoComplete="off"
              placeholder="Type message here..."
              value={message}
              onChange={handleChangeMessage}
            />
            <button
              type="submit"
              id="send"
              className="options__button"
              onClick={handleSendMessage}
            >
              <i className="fa fa-plus" aria-hidden="true">
                S
              </i>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
