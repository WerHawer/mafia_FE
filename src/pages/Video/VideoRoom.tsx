import { useParams } from 'react-router-dom';
import './video.css';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket.ts';
import { usePeer } from '../../hooks/usePeer.ts';
import { useUser } from '../../hooks/useUser.ts';
import { UserModal } from '../../UserModal.tsx';
import { IMessage, IMessageDTO } from '../../App.tsx';
import Peer from 'peerjs';
import { useUserMediaStream } from '../../hooks/useUserMediaStream.ts';
// import { uniqBy } from 'lodash/fp';

type UserStreams = Record<string, MediaStream>;

export const VideoRoom = () => {
  const { id = '' } = useParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [message, setMessage] = useState('');
  const [streams, setStreams] = useState<UserStreams>({});

  const chatRef = useRef<HTMLDivElement>(null);

  const { user, users, setUser } = useUser();
  const { socket } = useSocket(user);
  const { peer, peerId } = usePeer();
  const userMediaStream = useUserMediaStream(
    {
      audio: true,
      video: true,
    },
    !!user
  );

  const addVideoStream = useCallback((stream: MediaStream) => {
    setStreams((prev) => ({ ...prev, [stream.id]: stream }));
  }, []);

  const removeVideoStream = useCallback(() => {
    setTimeout(
      () =>
        setStreams((prev) => {
          const newStreams = { ...prev };
          const notActiveStreams = Object.values(prev).filter((s) => !s.active);

          if (!notActiveStreams.length) return prev;

          notActiveStreams.forEach((s) => {
            delete newStreams[s.id];
          });

          return newStreams;
        }),
      0
    );
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

      call.on('close', () => {
        removeVideoStream();
      });
    },
    [removeVideoStream]
  );

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!peerId || !socket) return;

    socket.emit('joinRoom', id, peerId);

    socket.on('getRoomMessages', (messages: IMessage[]) => {
      setMessages(messages);
    });
    socket.on('roomMessage', (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });
  }, [id, peerId, socket]);

  useEffect(() => {
    if (!userMediaStream || !user) return;

    addVideoStream(userMediaStream);
  }, [userMediaStream, user, peer, addVideoStream, peerId]);

  useEffect(() => {
    if (!peer || !socket || !userMediaStream) return;

    peer.on('call', (call) => {
      call.answer(userMediaStream);

      call.on('stream', (userVideoStream) => {
        addVideoStream(userVideoStream);
      });

      call.on('close', () => {
        removeVideoStream();
      });
    });

    socket.on('userConnectedToRoom', (otherUserId) => {
      const connectCb = (userVideoStream: MediaStream) => {
        addVideoStream(userVideoStream);
      };

      connectToNewUser(otherUserId, userMediaStream, peer, connectCb);
    });

    socket.on('userDisconnectedFromRoom', (userId) => {
      setStreams((prev) => {
        const newStreams = { ...prev };

        if (newStreams[userId]) {
          delete newStreams[userId];
        }

        return newStreams;
      });
    });
  }, [
    addVideoStream,
    connectToNewUser,
    peer,
    peerId,
    removeVideoStream,
    socket,
    userMediaStream,
  ]);

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

    const messageDTO: IMessageDTO = { ...newMessage, sender: user._id };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    socket?.emit('roomMessage', messageDTO);
  }, [socket, user, message, id]);

  return (
    <>
      <UserModal setUser={setUser} users={users} user={user} />

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
                    <div key={sender._id + index} className="message">
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
