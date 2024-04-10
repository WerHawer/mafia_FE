import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SERVER } from "../api/apiConstants.ts";
import { wsEvents } from "../config/wsEvents.ts";
import { observer } from "mobx-react-lite";
import { ListenFunction, MassSubscribeEvents } from "../types/socket.types.ts";
import { messagesStore } from "../store/messagesStore.ts";
import { gamesStore } from "../store/gamesStore.ts";
import { usersStore } from "../store/usersStore.ts";

export const SocketContext = createContext<{
  socket: Socket | null;
  isContext: boolean;
}>({
  socket: null,
  isContext: true,
});

export const SocketProvider = observer(({ children }: PropsWithChildren) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setNewMessage } = messagesStore;
  const { updateGames } = gamesStore;
  const { setSocketConnectedCount, setUserStreams } = usersStore;

  const subscribers: MassSubscribeEvents = useMemo(() => {
    if (!socket) return {};

    return {
      [wsEvents.connectionError]: (err) => {
        console.log("Error connecting to WebSocket server:", err.message);
      },
      [wsEvents.connection]: ({ message, connectedUsers }) => {
        console.log(message);
        setSocketConnectedCount(connectedUsers);
      },
      [wsEvents.disconnect]: (reason) => {
        if (reason === "io server disconnect") {
          socket.connect();
        }
      },
      [wsEvents.messageSend]: (message) => {
        setNewMessage(message);
      },
      [wsEvents.gameUpdate]: (newGame) => {
        updateGames(newGame);
      },
      [wsEvents.socketDisconnect]: (connectedUsers) => {
        setSocketConnectedCount(connectedUsers);
      },
      [wsEvents.roomConnection]: ({ streams }) => {
        setUserStreams(streams);
      },
      [wsEvents.peerDisconnect]: ({ streams }) => {
        setUserStreams(streams);
      },
    };
  }, [
    setNewMessage,
    setSocketConnectedCount,
    setUserStreams,
    socket,
    updateGames,
  ]);

  useEffect(() => {
    const existingSocket = io(SERVER);

    if (!existingSocket.connected) {
      existingSocket.connect();
    }

    setSocket(existingSocket);

    return () => {
      existingSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const listener: ListenFunction = (eventName, args) => {
      subscribers[eventName]?.(args);
    };

    socket.onAny(listener);

    return () => {
      socket.offAny(listener);
    };
  }, [socket, subscribers]);

  return (
    <SocketContext.Provider value={{ socket, isContext: true }}>
      <>{children}</>
    </SocketContext.Provider>
  );
});
