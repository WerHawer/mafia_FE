import { useRoomContext } from "@livekit/components-react";
import {
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { useCallback, useEffect, useRef } from "react";

import { getExpectedCameraIdentities } from "@/helpers/expectedVideoParticipants.ts";
import { requestDebouncedVideoRepublish } from "@/helpers/videoRecoveryBridge.ts";
import { getLocalCameraIntentionallyMuted } from "@/hooks/usePublishVideoTrack.ts";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

const GRID_HEALTH_INTERVAL_MS = 12_000;
const RECOVERY_DEBOUNCE_MS = 3_500;
const RESUBSCRIBE_GAP_MS = 150;

export type UseVideoGridHealthRecoveryParams = {
  shouldShowMyVideo: boolean;
  shouldShowPlayerVideo: (participantId: UserId) => boolean;
};

const isRemoteCameraHealthy = (
  participant: RemoteParticipant | undefined
): boolean => {
  if (!participant) return false;

  const pub = participant.getTrackPublication(Track.Source.Camera);

  if (!pub?.isSubscribed || !pub.track) return false;

  return pub.track.mediaStreamTrack?.readyState !== "ended";
};

const isLocalCameraOkWhenExpected = (
  room: Room,
  expectLocalCamera: boolean
): boolean => {
  if (!expectLocalCamera) return true;

  if (getLocalCameraIntentionallyMuted()) return true;

  const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);

  if (!pub?.track) return false;

  return pub.track.mediaStreamTrack?.readyState !== "ended";
};

const tryResubscribeRemoteCamera = async (
  participant: RemoteParticipant
): Promise<void> => {
  const pub = participant.getTrackPublication(Track.Source.Camera);

  if (!pub || typeof pub.setSubscribed !== "function") return;

  try {
    await pub.setSubscribed(false);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, RESUBSCRIBE_GAP_MS);
    });
    await pub.setSubscribed(true);
  } catch (error) {
    console.warn("[VideoGridHealth] Remote camera resubscribe failed:", error);
  }
};

export const useVideoGridHealthRecovery = (
  params: UseVideoGridHealthRecoveryParams
) => {
  const room = useRoomContext();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryInFlightRef = useRef(false);

  const runRecovery = useCallback(async () => {
    if (recoveryInFlightRef.current) return;

    const { gamesStore, usersStore } = rootStore;

    if (gamesStore.mockStreamsEnabled) return;

    if (!room || room.state !== "connected") return;

    recoveryInFlightRef.current = true;

    try {
      const { expectLocalCamera, expectedRemoteIds } = getExpectedCameraIdentities({
        myId: usersStore.myId,
        isGameStarted: gamesStore.gameFlow.isStarted,
        shouldShowMyVideo: params.shouldShowMyVideo,
        shouldShowPlayerVideo: params.shouldShowPlayerVideo,
        activeGamePlayers: gamesStore.activeGamePlayers,
        activeGameGm: gamesStore.activeGameGm,
        mockStreamsEnabled: gamesStore.mockStreamsEnabled,
      });

      for (const remoteId of expectedRemoteIds) {
        const rp = room.remoteParticipants.get(remoteId);

        if (!rp) continue;

        if (!isRemoteCameraHealthy(rp)) {
          console.log(
            "[VideoGridHealth] Recovering remote camera subscription:",
            remoteId
          );
          await tryResubscribeRemoteCamera(rp);
        }
      }

      if (
        expectLocalCamera &&
        !isLocalCameraOkWhenExpected(room, expectLocalCamera)
      ) {
        console.log(
          "[VideoGridHealth] Local camera missing or dead — requesting republish"
        );
        requestDebouncedVideoRepublish();
      }
    } finally {
      recoveryInFlightRef.current = false;
    }
  }, [
    room,
    params.shouldShowMyVideo,
    params.shouldShowPlayerVideo,
  ]);

  const scheduleRecovery = useCallback(() => {
    if (debounceTimerRef.current !== null) return;

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void runRecovery();
    }, RECOVERY_DEBOUNCE_MS);
  }, [runRecovery]);

  const scan = useCallback(() => {
    const { gamesStore, usersStore } = rootStore;

    if (gamesStore.mockStreamsEnabled) return;

    if (!room || room.state !== "connected") return;

    const { expectLocalCamera, expectedRemoteIds } = getExpectedCameraIdentities({
      myId: usersStore.myId,
      isGameStarted: gamesStore.gameFlow.isStarted,
      shouldShowMyVideo: params.shouldShowMyVideo,
      shouldShowPlayerVideo: params.shouldShowPlayerVideo,
      activeGamePlayers: gamesStore.activeGamePlayers,
      activeGameGm: gamesStore.activeGameGm,
      mockStreamsEnabled: gamesStore.mockStreamsEnabled,
    });

    let needsRecovery = false;

    for (const remoteId of expectedRemoteIds) {
      const rp = room.remoteParticipants.get(remoteId);

      if (!rp) continue;

      if (!isRemoteCameraHealthy(rp)) {
        needsRecovery = true;

        break;
      }
    }

    if (
      !needsRecovery &&
      expectLocalCamera &&
      !isLocalCameraOkWhenExpected(room, expectLocalCamera)
    ) {
      needsRecovery = true;
    }

    if (needsRecovery) {
      scheduleRecovery();
    }
  }, [
    room,
    params.shouldShowMyVideo,
    params.shouldShowPlayerVideo,
    scheduleRecovery,
  ]);

  useEffect(() => {
    if (!room) return;

    const onRoomEvent = (): void => {
      scan();
    };

    room.on(RoomEvent.ParticipantConnected, onRoomEvent);
    room.on(RoomEvent.ParticipantDisconnected, onRoomEvent);
    room.on(RoomEvent.TrackPublished, onRoomEvent);
    room.on(RoomEvent.TrackSubscribed, onRoomEvent);
    room.on(RoomEvent.TrackSubscriptionFailed, onRoomEvent);
    room.on(RoomEvent.TrackUnsubscribed, onRoomEvent);
    room.on(RoomEvent.Reconnected, onRoomEvent);
    room.on(RoomEvent.Connected, onRoomEvent);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onRoomEvent);
      room.off(RoomEvent.ParticipantDisconnected, onRoomEvent);
      room.off(RoomEvent.TrackPublished, onRoomEvent);
      room.off(RoomEvent.TrackSubscribed, onRoomEvent);
      room.off(RoomEvent.TrackSubscriptionFailed, onRoomEvent);
      room.off(RoomEvent.TrackUnsubscribed, onRoomEvent);
      room.off(RoomEvent.Reconnected, onRoomEvent);
      room.off(RoomEvent.Connected, onRoomEvent);
    };
  }, [room, scan]);

  useEffect(() => {
    scan();
  }, [scan]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      scan();
    }, GRID_HEALTH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [room, scan]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);
};
