import { observer } from "mobx-react-lite";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../api/apiConstants.ts";
import { SERVER } from "../api/apiConstants.ts";
import { wsEvents } from "../config/wsEvents.ts";
import { gamesStore } from "../store/gamesStore.ts";
import { messagesStore } from "../store/messagesStore.ts";
import { usersStore } from "../store/usersStore.ts";
import { IGame, IGameShort } from "../types/game.types.ts";
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

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { setNewMessage, replaceMessages } = messagesStore;
  const { updateGame, updateGames, setToProposed, addVoted, addShoot } =
    gamesStore;
  const { setSocketConnectedCount, updateOnlineUsers, myId } = usersStore;

  const updateRQGamesCache = useCallback(
    (newGame: IGame | IGameShort) => {
      queryClient.setQueryData<any>([queryKeys.games], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;

        // Game became inactive — remove from the active list
        if (!newGame.isActive) {
          return { ...oldData, data: oldData.data.filter((g: any) => g.id !== newGame.id) };
        }

        const exists = oldData.data.some((g: any) => g.id === newGame.id);
        if (!exists) return { ...oldData, data: [...oldData.data, newGame] };
        return {
          ...oldData,
          data: oldData.data.map((g: any) =>
            g.id === newGame.id ? newGame : g
          ),
        };
      });
    },
    [queryClient]
  );

  const updateRQSingleGameCache = useCallback(
    (newGame: IGame) => {
      queryClient.setQueryData<any>(
        [queryKeys.game, newGame.id],
        (oldData: any) => {
          if (!oldData) return { data: newGame };
          return { ...oldData, data: newGame };
        }
      );
    },
    [queryClient]
  );

  const subscribers: MassSubscribeEvents = useMemo(() => {
    if (!socket) return {};

    return {
      [wsEvents.connectionError]: (err) => {
        console.log("Error connecting to WebSocket server:", err.message);
        setConnectionAttempts((prev) => prev + 1);
      },
      [wsEvents.connection]: ({ message, connectedUsers, onlineUsers }) => {
        console.log(message);
        setSocketConnectedCount(connectedUsers);
        if (onlineUsers) updateOnlineUsers(onlineUsers);
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
      [wsEvents.messagesUpdate]: (messages) => {
        replaceMessages(messages);
      },
      [wsEvents.roomConnection]: (data) => {
        updateGames(data.game);
        updateRQGamesCache(data.game);
      },
      [wsEvents.roomLeave]: (data) => {
        updateGames(data.game);
        updateRQGamesCache(data.game);
      },
      [wsEvents.gameUpdate]: (newGame) => {
        updateGame(newGame);
        updateRQGamesCache(newGame);
        updateRQSingleGameCache(newGame);
      },
      [wsEvents.gamesUpdate]: (newGame) => {
        updateGames(newGame);
        updateRQGamesCache(newGame);
      },
      [wsEvents.gameNotFound]: ({ roomId }) => {
        console.warn(
          `Game ${roomId} was not found on the server. Clearing local state.`
        );
        gamesStore.removeActiveGame();
      },
      [wsEvents.gmChanged]: ({ newGMId, reason }: { newGMId: string; reason: string }) => {
        if (!newGMId || newGMId !== myId) return;

        if (reason === 'left_before_start') {
          toast(t('gm.youAreNewGM'), { icon: '👑', duration: 6000 });
        } else if (reason === 'restarted_after_gm_left') {
          toast(t('gm.youAreNewGMAfterRestart'), { icon: '👑', duration: 6000 });
        }
      },
      [wsEvents.socketDisconnect]: (data) => {
        const { connectedUsers, onlineUsers } = typeof data === 'object' ? data : { connectedUsers: data, onlineUsers: [] };
        setSocketConnectedCount(connectedUsers);
        if (onlineUsers) updateOnlineUsers(onlineUsers);
      },
      [wsEvents.addToProposed]: ({ userId, proposerId }) => {
        setToProposed(userId, proposerId);
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
    replaceMessages,
    updateGames,
    updateGame,
    setToProposed,
    addVoted,
    addShoot,
  ]);

  useEffect(() => {
    if (!myId) return;

    // Detect if using tunnel and use relative path for WebSocket
    const isUsingTunnel =
      window.location.hostname.includes("ngrok") ||
      window.location.hostname.includes("loca.lt") ||
      window.location.hostname.includes("cloudflare");

    const socketUrl = isUsingTunnel ? window.location.origin : SERVER;

    console.log("Connecting to WebSocket:", socketUrl);

    const existingSocket = io(socketUrl, {
      // Enhanced connection options for better reliability
      path: isUsingTunnel ? "/socket.io" : "/socket.io",
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 30000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 20,
      randomizationFactor: 0.5,
      // Pass user ID for custom socket identification
      auth: {
        userId: myId,
      },
    });

    // Connection event handlers
    existingSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnectionAttempts(0);
      setLastConnectionTime(Date.now());

      const gameId = gamesStore.activeGameId;
      const isGameRoute = window.location.pathname.startsWith("/game/");
      
      if (gameId && myId && isGameRoute) {
        console.log(
          "Socket connected during active game. Re-joining room.",
          gameId
        );
        existingSocket.emit(wsEvents.roomConnection, [gameId, myId]);
      }
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

    // Explicitly disconnect on tab/browser close so the BE receives the
    // disconnect event immediately instead of waiting for the ping timeout.
    // navigator.sendBeacon is used as a guaranteed fire-and-forget fallback
    // for cases where the browser doesn't execute JS synchronously on close.
    const onBeforeUnload = () => {
      existingSocket.disconnect();
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      existingSocket.disconnect();
    };
  }, [myId]);

  useEffect(() => {
    if (!socket || !myId) return;

    const interval = setInterval(() => {
      const gameId = gamesStore.activeGameId;
      const isGameRoute = window.location.pathname.startsWith("/game/");

      // Only emit healthCheck if socket is naturally connected and user is on the game page.
      // Socket.IO Native heartbeat will handle dropping and reconnecting.
      if (socket.connected && gameId && myId && isGameRoute) {
        socket.emit(wsEvents.healthCheck, { gameId, userId: myId }, () => {
          // We just send healthCheck to let backend know we are alive
          // and backend will force socket.join(gameId) if we fell out of the room.
        });
      } else if (!isGameRoute && gameId) {
        // If the user has an activeGameId in store but is not on the game route,
        // it means they navigated away without unmounting (e.g. address bar).
        // We should clear the stale state to prevent any weird issues.
        gamesStore.removeActiveGame();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [socket, myId]);

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
