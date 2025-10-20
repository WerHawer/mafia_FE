import { useCallback } from "react";

import { useSocketContext } from "../context/SocketProvider.tsx";
import {
  MassSubscribeFunction,
  SubscribeEvent,
  SubscribeFunction,
} from "../types/socket.types.ts";
import { useSocketQueue } from "./useSocketQueue.ts";

export const useSocket = () => {
  const { socket, connectionAttempts, lastConnectionTime } = useSocketContext();

  const isConnected = socket?.connected;

  // Use the queue system for reliable message delivery
  const { sendMessage, queueSize, isProcessing, clearQueue, getQueueStats } =
    useSocketQueue(socket);

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
    // New queue-related exports
    queueSize,
    isProcessing,
    clearQueue,
    getQueueStats,
    // Connection state information
    connectionAttempts,
    lastConnectionTime,
  };
};
