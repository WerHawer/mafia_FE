import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER } from "../api/apiConstants.ts";
import { wsEvents } from "../config/wsEvents.ts";
import { observer } from "mobx-react-lite";

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

    socket.on(wsEvents.disconnect, (reason) => {
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
