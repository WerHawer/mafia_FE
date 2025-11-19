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
  connectionAttempts: number;
  lastConnectionTime: number | null;
}>({
  socket: null,
  connectionAttempts: 0,
  lastConnectionTime: null,
});

export const SocketProvider = observer(({ children }: PropsWithChildren) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(
    null
  );

  const { setNewMessage } = messagesStore;
  const { updateGame, updateGames, setToProposed, addVoted, addShoot } =
    gamesStore;
  const { setSocketConnectedCount } = usersStore;

  const subscribers: MassSubscribeEvents = useMemo(() => {
    if (!socket) return {};

    return {
      [wsEvents.connectionError]: (err) => {
        console.log("Error connecting to WebSocket server:", err.message);
        setConnectionAttempts((prev) => prev + 1);
      },
      [wsEvents.connection]: ({ message, connectedUsers }) => {
        console.log(message);
        setSocketConnectedCount(connectedUsers);
        setConnectionAttempts(0); // Reset attempts on successful connection
        setLastConnectionTime(Date.now());
      },
      [wsEvents.disconnect]: (reason) => {
        console.log("Socket disconnected:", reason);
        setLastConnectionTime(Date.now());

        if (reason === "io server disconnect") {
          // Server initiated disconnect, reconnect immediately
          socket.connect();
        } else if (
          reason === "transport close" ||
          reason === "transport error"
        ) {
          // Network issues, try to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
          setTimeout(() => {
            if (!socket.connected) {
              socket.connect();
            }
          }, delay);
        }
      },
      [wsEvents.messageSend]: (message) => {
        setNewMessage(message);
      },
      [wsEvents.roomConnection]: (data) => {
        updateGames(data.game);
      },
      [wsEvents.roomLeave]: (data) => {
        updateGames(data.game);
      },
      [wsEvents.gameUpdate]: (newGame) => {
        updateGame(newGame);
      },
      [wsEvents.gamesUpdate]: (newGame) => {
        updateGames(newGame);
      },
      [wsEvents.socketDisconnect]: (connectedUsers) => {
        setSocketConnectedCount(connectedUsers);
      },
      [wsEvents.addToProposed]: (userId) => {
        setToProposed(userId);
      },
      [wsEvents.vote]: (data) => {
        addVoted(data);
      },
      [wsEvents.shoot]: (data) => {
        addShoot(data);
      },
      [wsEvents.userCameraStatusChanged]: (data) => {
        console.log("Camera status changed:", data);
      },
      [wsEvents.userMicrophoneStatusChanged]: (data) => {
        console.log("Microphone status changed:", data);
      },
    };
  }, [
    socket,
    setSocketConnectedCount,
    connectionAttempts,
    setNewMessage,
    updateGames,
    updateGame,
    setToProposed,
    addVoted,
    addShoot,
  ]);

  useEffect(() => {
    const existingSocket = io(SERVER, {
      // Enhanced connection options for better reliability
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
      randomizationFactor: 0.5,
    });

    // Connection event handlers
    existingSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnectionAttempts(0);
      setLastConnectionTime(Date.now());
    });

    existingSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionAttempts((prev) => prev + 1);
    });

    existingSocket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnectionAttempts(0);
      setLastConnectionTime(Date.now());
    });

    existingSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      setConnectionAttempts(attemptNumber);
    });

    existingSocket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    existingSocket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after all attempts");
    });

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
    <SocketContext.Provider
      value={{
        socket,
        connectionAttempts,
        lastConnectionTime,
      }}
    >
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
