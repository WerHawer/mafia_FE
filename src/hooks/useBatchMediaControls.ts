import { useCallback } from "react";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

type SetMicrophonesForAllParams = {
  enabled: boolean;
  excludedUserIds: UserId[];
  reason?: "night" | "day" | "speaker" | "manual";
};

export const useBatchMediaControls = () => {
  const { socket, sendMessage } = useSocket();
  const { gamesStore, usersStore } = rootStore;
  const { activeGameId: roomId, activeGameAlivePlayers: allUserIds } =
    gamesStore;
  const { myId: requesterId } = usersStore;

  const setMicrophonesForAll = useCallback(
    ({
      enabled,
      excludedUserIds,
      reason = "manual",
    }: SetMicrophonesForAllParams) => {
      if (!socket) return;

      const targetUserIds = allUserIds.filter(
        (userId) => !excludedUserIds.includes(userId)
      );

      sendMessage(wsEvents.batchToggleMicrophones, {
        roomId: roomId ?? "",
        enabled,
        targetUserIds,
        excludedUserIds,
        requesterId,
      });
    },
    [socket, sendMessage, roomId, requesterId, allUserIds]
  );

  // Ready-made helpers for specific game situations
  const muteAllForNight = useCallback(
    (gmUserId?: UserId) => {
      setMicrophonesForAll({
        enabled: false,
        excludedUserIds: gmUserId ? [gmUserId] : [],
        reason: "night",
      });
    },
    [setMicrophonesForAll]
  );

  const muteAllExceptSpeaker = useCallback(
    (speakerId: UserId, gmUserId?: UserId) => {
      setMicrophonesForAll({
        enabled: false,
        excludedUserIds: [speakerId, gmUserId ?? ""],
        reason: "speaker",
      });
    },
    [setMicrophonesForAll]
  );

  const muteAllExceptGM = useCallback(
    (gmUserId?: UserId) => {
      if (!gmUserId) return;

      setMicrophonesForAll({
        enabled: false,
        excludedUserIds: [gmUserId],
        reason: "manual",
      });
    },
    [setMicrophonesForAll]
  );

  const unmuteAllForDay = useCallback(() => {
    setMicrophonesForAll({
      enabled: true,
      excludedUserIds: [],
      reason: "day",
    });
  }, [setMicrophonesForAll]);

  const muteAll = useCallback(() => {
    setMicrophonesForAll({
      enabled: false,
      excludedUserIds: [],
      reason: "manual",
    });
  }, [setMicrophonesForAll]);

  const unmuteAll = useCallback(() => {
    setMicrophonesForAll({
      enabled: true,
      excludedUserIds: [],
      reason: "manual",
    });
  }, [setMicrophonesForAll]);

  const toggleMicrophoneForUser = useCallback(
    (userId: UserId, enabled: boolean) => {
      if (!socket) return;

      sendMessage(wsEvents.batchToggleMicrophones, {
        roomId: roomId ?? "",
        enabled,
        targetUserIds: [userId],
        excludedUserIds: [],
        requesterId,
      });
    },
    [socket, sendMessage, roomId, requesterId]
  );

  const muteSpeaker = useCallback(
    (userId: UserId) => {
      toggleMicrophoneForUser(userId, false);
    },
    [toggleMicrophoneForUser]
  );

  const unmuteSpeaker = useCallback(
    (userId: UserId) => {
      toggleMicrophoneForUser(userId, true);
    },
    [toggleMicrophoneForUser]
  );

  return {
    setMicrophonesForAll,
    toggleMicrophoneForUser,

    muteAllForNight,
    muteAllExceptSpeaker,
    unmuteAllForDay,
    muteAll,
    unmuteAll,
    muteAllExceptGM,
    muteSpeaker,
    unmuteSpeaker,
  };
};
