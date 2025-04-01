import { useCallback } from "react";

import { useSocketContext } from "../context/SocketProvider.tsx";
import {
  MassSubscribeFunction,
  SendMessageFunction,
  SubscribeEvent,
  SubscribeFunction,
} from "../types/socket.types.ts";

export const useSocket = () => {
  const { socket } = useSocketContext();

  const isConnected = socket?.connected;

  const subscribe: SubscribeFunction = useCallback(
    (event, cb) => {
      if (!socket) {
        throw new Error("Socket instance is not available.");
      }

      // @ts-ignore
      socket.on(event, cb);

      return () => {
        // @ts-ignore
        socket.off(event, cb);
      };
    },
    [socket]
  );

  const massSubscribe: MassSubscribeFunction = useCallback(
    (events) => {
      const unsubscribeFunctions: Array<() => void> = [];

      Object.entries(events).forEach(([event, callback]) => {
        if (callback) {
          // @ts-ignore
          const unsubscribe = subscribe(event as SubscribeEvent, callback);
          unsubscribeFunctions.push(unsubscribe);
        }
      });

      return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    },
    [subscribe]
  );

  const sendMessage: SendMessageFunction = useCallback(
    (event, data) => {
      if (!socket) {
        throw new Error("Socket instance is not available.");
      }

      socket.emit(event, data);
    },
    [socket]
  );

  const connect = useCallback(() => {
    socket?.connect();
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
  }, [socket]);

  return {
    socket,
    sendMessage,
    subscribe,
    isConnected,
    disconnect,
    connect,
    massSubscribe,
  };
};
