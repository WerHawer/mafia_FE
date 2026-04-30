import { throttle } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { reactionsStore } from "@/store/reactionsStore.ts";
import { rootStore } from "@/store/rootStore.ts";

/**
 * Subscribes to incoming gameReaction socket events and exposes
 * a `sendReaction` callback. Mount once at the GamePage level.
 */
export const useGameReactions = () => {
  const { id: gameId = "" } = useParams();
  const { subscribe, sendMessage } = useSocket();
  const { usersStore } = rootStore;
  const { myId } = usersStore;

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.gameReaction, ({ userId, userName, emoji }) => {
      const finalName = usersStore.getUserName(userId) || userName || userId;
      reactionsStore.addReaction(userId, finalName, emoji);
    });

    return unsubscribe;
  }, [subscribe]);

  const throttledSend = useMemo(
    () =>
      throttle((emoji: string) => {
        if (!gameId || !myId) return;
        sendMessage(wsEvents.gameReaction, { gameId, userId: myId, emoji });
      }, 100), // Max ~10 reactions per second
    [gameId, myId, sendMessage]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      throttledSend(emoji);
    },
    [throttledSend]
  );

  return { sendReaction };
};
