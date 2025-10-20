import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

import {
  HIGH_PRIORITY_EVENTS,
  MessagePriority,
  NORMAL_PRIORITY_EVENTS,
  PRIORITY_ORDER,
  PRIORITY_WEIGHT,
  QUEUE_CONFIG,
  QueuedMessage,
  QueueStats,
  SendMessageFunction,
  SocketQueueConfig,
  WSSentEventData,
} from "../types/socket.types";

const DEFAULT_CONFIG: SocketQueueConfig = {
  maxRetries: QUEUE_CONFIG.DEFAULT_MAX_RETRIES,
  retryDelay: QUEUE_CONFIG.DEFAULT_RETRY_DELAY_MS,
  maxQueueSize: QUEUE_CONFIG.DEFAULT_MAX_QUEUE_SIZE,
  enablePersistence: true,
} as const;

export const useSocketQueue = (
  socket: Socket | null,
  config: Partial<SocketQueueConfig> = {}
) => {
  const finalConfig: SocketQueueConfig = { ...DEFAULT_CONFIG, ...config };
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const retryTimeoutRef = useRef<number>();

  // Generate unique message ID with timestamp and random component
  const generateId = useCallback((): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  }, []);

  // Determine message priority based on event type
  const getMessagePriority = useCallback(
    (event: keyof WSSentEventData): MessagePriority => {
      if (HIGH_PRIORITY_EVENTS.has(event as any)) {
        return MessagePriority.HIGH;
      }

      if (NORMAL_PRIORITY_EVENTS.has(event as any)) {
        return MessagePriority.NORMAL;
      }

      return MessagePriority.LOW;
    },
    []
  );

  // Calculate max attempts based on priority
  const getMaxAttempts = useCallback(
    (priority: MessagePriority): number => {
      return priority === MessagePriority.HIGH
        ? finalConfig.maxRetries + QUEUE_CONFIG.HIGH_PRIORITY_EXTRA_RETRIES
        : finalConfig.maxRetries;
    },
    [finalConfig.maxRetries]
  );

  // Sort queue by priority (high first) then by timestamp (oldest first)
  const sortQueue = useCallback(
    (messages: QueuedMessage[]): QueuedMessage[] => {
      return [...messages].sort((a, b) => {
        const priorityDiff =
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
    },
    []
  );

  // Load persisted queue from localStorage
  const loadQueueFromStorage = useCallback((): QueuedMessage[] => {
    if (!finalConfig.enablePersistence) {
      return [];
    }

    try {
      const stored = localStorage.getItem(QUEUE_CONFIG.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsedQueue: QueuedMessage[] = JSON.parse(stored);
      const expiryThreshold = Date.now() - QUEUE_CONFIG.STORAGE_EXPIRY_MS;

      return parsedQueue.filter(
        (message) => message.timestamp > expiryThreshold
      );
    } catch (error) {
      console.warn("Failed to load socket queue from storage:", error);
      return [];
    }
  }, [finalConfig.enablePersistence]);

  // Persist queue to localStorage
  const saveQueueToStorage = useCallback(
    (queueToSave: QueuedMessage[]): void => {
      if (!finalConfig.enablePersistence) {
        return;
      }

      try {
        localStorage.setItem(
          QUEUE_CONFIG.STORAGE_KEY,
          JSON.stringify(queueToSave)
        );
      } catch (error) {
        console.warn("Failed to save socket queue to storage:", error);
      }
    },
    [finalConfig.enablePersistence]
  );

  // Initialize queue from storage on mount
  useEffect(() => {
    const storedQueue = loadQueueFromStorage();
    if (storedQueue.length > 0) {
      setQueue(storedQueue);
    }
  }, [loadQueueFromStorage]);

  // Persist queue changes to storage
  useEffect(() => {
    saveQueueToStorage(queue);
  }, [queue, saveQueueToStorage]);

  // Process messages from queue in batches
  const processQueue = useCallback(async (): Promise<void> => {
    if (!socket?.connected || isProcessing || queue.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      const sortedQueue = sortQueue(queue);
      const messagesToProcess = sortedQueue.slice(
        0,
        QUEUE_CONFIG.BATCH_PROCESS_LIMIT
      );

      for (const message of messagesToProcess) {
        try {
          socket.emit(message.event, message.data);

          // Remove successful message from queue
          setQueue((prevQueue) =>
            prevQueue.filter((msg) => msg.id !== message.id)
          );

          // Throttle to avoid overwhelming the server
          if (messagesToProcess.length > 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, QUEUE_CONFIG.MESSAGE_DELAY_MS)
            );
          }
        } catch (error) {
          console.error("Failed to send queued message:", error);

          // Handle failed message
          if (message.attempts < message.maxAttempts) {
            // Increment attempts for retry
            setQueue((prevQueue) =>
              prevQueue.map((msg) =>
                msg.id === message.id
                  ? { ...msg, attempts: msg.attempts + 1 }
                  : msg
              )
            );
          } else {
            // Remove message that exceeded max attempts
            setQueue((prevQueue) =>
              prevQueue.filter((msg) => msg.id !== message.id)
            );
            console.warn("Message failed after max attempts:", {
              event: message.event,
              attempts: message.attempts,
              maxAttempts: message.maxAttempts,
            });
          }
        }
      }

      // Schedule retry for remaining messages
      const remainingCount = queue.length - messagesToProcess.length;
      if (remainingCount > 0) {
        retryTimeoutRef.current = window.setTimeout(() => {
          processQueue();
        }, finalConfig.retryDelay);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [socket, isProcessing, queue, sortQueue, finalConfig.retryDelay]);

  // Trigger queue processing when conditions are met
  useEffect(() => {
    if (socket?.connected && queue.length > 0) {
      processQueue();
    }
  }, [socket?.connected, queue.length, processQueue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced sendMessage with intelligent queueing
  const sendMessage: SendMessageFunction = useCallback(
    (event, data) => {
      const priority = getMessagePriority(event);
      const maxAttempts = getMaxAttempts(priority);

      const queuedMessage: QueuedMessage = {
        id: generateId(),
        event,
        data,
        timestamp: Date.now(),
        attempts: 0,
        maxAttempts,
        priority,
      };

      // Attempt immediate send if connected
      if (socket?.connected) {
        try {
          socket.emit(event, data);
          return; // Success - no need to queue
        } catch (error) {
          console.warn("Failed to send message immediately, queueing:", error);
        }
      }

      // Add to queue with size management
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue, queuedMessage];

        // Enforce queue size limit by removing oldest low-priority messages
        if (newQueue.length > finalConfig.maxQueueSize) {
          const sortedByImportance = newQueue.sort(
            (a, b) =>
              PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
              b.timestamp - a.timestamp
          );
          return sortedByImportance.slice(0, finalConfig.maxQueueSize);
        }

        return newQueue;
      });
    },
    [
      socket,
      generateId,
      getMessagePriority,
      getMaxAttempts,
      finalConfig.maxQueueSize,
    ]
  );

  // Clear entire queue and storage
  const clearQueue = useCallback((): void => {
    setQueue([]);
    if (finalConfig.enablePersistence) {
      localStorage.removeItem(QUEUE_CONFIG.STORAGE_KEY);
    }
  }, [finalConfig.enablePersistence]);

  // Get detailed queue statistics
  const getQueueStats = useCallback((): QueueStats => {
    const stats = queue.reduce(
      (acc, msg) => {
        acc.total++;
        acc[msg.priority]++;
        if (msg.attempts >= msg.maxAttempts) {
          acc.failed++;
        }
        return acc;
      },
      { total: 0, high: 0, normal: 0, low: 0, failed: 0 }
    );

    return stats;
  }, [queue]);

  return {
    sendMessage,
    queueSize: queue.length,
    isProcessing,
    clearQueue,
    getQueueStats,
  } as const;
};
