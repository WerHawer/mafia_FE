import { observer } from "mobx-react-lite";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

import { SERVER } from "../api/apiConstants.ts";
import { wsEvents } from "../config/wsEvents.ts";
import { gamesStore } from "../store/gamesStore.ts";
import { messagesStore } from "../store/messagesStore.ts";
import { usersStore } from "../store/usersStore.ts";
import { ListenFunction, MassSubscribeEvents } from "../types/socket.types.ts";

export const SocketContext = createContext<{
  socket: Socket | null;
}>({
  socket: null,
});

export const SocketProvider = observer(({ children }: PropsWithChildren) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const { setNewMessage } = messagesStore;
  const { updateGames } = gamesStore;
  const { setSocketConnectedCount } = usersStore;

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
      [wsEvents.roomConnection]: (data) => {
        console.log("RoomConnection data:", data);
      },
      [wsEvents.roomLeave]: (data) => {
        console.log("RoomLeave data:", data);
      },
      [wsEvents.gameUpdate]: (newGame) => {
        updateGames(newGame);
      },
      [wsEvents.socketDisconnect]: (connectedUsers) => {
        setSocketConnectedCount(connectedUsers);
      },
    };
  }, [setNewMessage, setSocketConnectedCount, socket, updateGames]);

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
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
});

export const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }

  return context;
};
