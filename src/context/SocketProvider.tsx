import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SERVER } from "../api/apiConstants.ts";
import { wsEvents } from "../config/wsEvents.ts";
import { userStore } from "../store/mobx/userStore.ts";
import { observer } from "mobx-react-lite";
import { EventParams } from "@socket.io/component-emitter";

export const SocketContext = createContext<{
  socket: Socket | null;
  isContext: boolean;
}>({ socket: null, isContext: true });

export const SocketProvider = observer(({ children }: PropsWithChildren) => {
  const [socket, setSocket] = useState<Socket | null>(null);

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

    socket.on(wsEvents.connectionError, (err) => {
      console.log("Error connecting to WebSocket server:", err.message);
    });

    socket.on(wsEvents.connection, (message) => {
      console.log(message);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isContext: true }}>
      <>{children}</>
    </SocketContext.Provider>
  );
});

export const useSocket = () => {
  const { socket, isContext } = useContext(SocketContext);

  if (!isContext) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  const isConnected = socket?.connected;

  const sendMessage = useCallback(
    (event: wsEvents, ...data: EventParams<any, any>) => {
      socket?.emit(event, ...data);
    },
    [socket],
  );

  const subscribe = useCallback(
    (event: wsEvents, cb: (data?: any) => void) => {
      const cbHandler = cb;

      socket?.on(event, cbHandler);

      return () => {
        socket?.off(event, cbHandler);
      };
    },
    [socket],
  );

  const connect = useCallback(() => {
    socket?.connect();
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
  }, [socket]);

  return { socket, sendMessage, subscribe, isConnected, disconnect, connect };
};
