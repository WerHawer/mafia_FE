import { useRoomContext } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { useCallback, useEffect, useState } from "react";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";

type UseMediaControlsProps = {
  participant: Participant;
  isMyStream: boolean;
  isIGM?: boolean;
  roomId: string;
  requesterId: string;
};

type MediaControlsState = {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
};

export const useMediaControls = ({
  participant,
  isMyStream,
  isIGM = false,
  roomId,
  requesterId,
}: UseMediaControlsProps) => {
  const { socket, subscribe, sendMessage } = useSocket();
  const room = useRoomContext();
  const localParticipant = room.localParticipant;

  const [mediaState, setMediaState] = useState<MediaControlsState>({
    isCameraEnabled: false,
    isMicrophoneEnabled: false,
  });

  // Update media state based on LiveKit track events
  useEffect(() => {
    const updateMediaState = () => {
      const videoPublication = participant.getTrackPublication(
        Track.Source.Camera
      );
      const audioPublication = participant.getTrackPublication(
        Track.Source.Microphone
      );

      setMediaState({
        isCameraEnabled: !videoPublication?.isMuted ?? false,
        isMicrophoneEnabled: !audioPublication?.isMuted ?? false,
      });
    };

    updateMediaState();

    participant.on("trackMuted", updateMediaState);
    participant.on("trackUnmuted", updateMediaState);
    participant.on("trackPublished", updateMediaState);
    participant.on("trackUnpublished", updateMediaState);

    return () => {
      participant.off("trackMuted", updateMediaState);
      participant.off("trackUnmuted", updateMediaState);
      participant.off("trackPublished", updateMediaState);
      participant.off("trackUnpublished", updateMediaState);
    };
  }, [participant]);

  // Handle WebSocket events for media control commands
  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const { myId } = rootStore.usersStore;

    const handleCameraStatusChanged = async (data: {
      userId: string;
      participantIdentity: string;
      enabled: boolean;
      targetIdentity?: string;
    }) => {
      console.log("[Media Control] Camera status changed:", data);

      // Update UI state for all participants
      if (data.userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isCameraEnabled: data.enabled,
        }));
      }

      // Execute local action if command is for current user
      const isForMe =
        data.targetIdentity === myId ||
        data.targetIdentity === participant.identity ||
        (participant.isLocal && data.userId === myId);

      if (isForMe && participant.isLocal) {
        try {
          console.log(
            `[Media Control] Executing local camera ${data.enabled ? "unmute" : "mute"}`
          );
          await localParticipant.setCameraEnabled(data.enabled);
        } catch (error) {
          console.error("[Media Control] Error toggling camera:", error);
        }
      }
    };

    const handleMicrophoneStatusChanged = async (data: {
      userId: string;
      participantIdentity: string;
      enabled: boolean;
      targetIdentity?: string;
    }) => {
      console.log("[Media Control] Microphone status changed:", data);

      // Update UI state for all participants
      if (data.userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isMicrophoneEnabled: data.enabled,
        }));
      }

      // Execute local action if command is for current user
      const isForMe =
        data.targetIdentity === myId ||
        data.targetIdentity === participant.identity ||
        (participant.isLocal && data.userId === myId);

      if (isForMe && participant.isLocal) {
        try {
          console.log(
            `[Media Control] Executing local microphone ${data.enabled ? "unmute" : "mute"}`
          );
          await localParticipant.setMicrophoneEnabled(data.enabled);
        } catch (error) {
          console.error("[Media Control] Error toggling microphone:", error);
        }
      }
    };

    const unsubscribeCamera = subscribe(
      wsEvents.userCameraStatusChanged as any,
      handleCameraStatusChanged
    );
    const unsubscribeMicrophone = subscribe(
      wsEvents.userMicrophoneStatusChanged as any,
      handleMicrophoneStatusChanged
    );

    return () => {
      unsubscribeCamera();
      unsubscribeMicrophone();
    };
  }, [socket, participant, subscribe, localParticipant]);

  const toggleCamera = useCallback(() => {
    if (!socket) return;

    const canControl = isMyStream || isIGM;
    if (!canControl) return;

    try {
      const currentlyEnabled = mediaState.isCameraEnabled;
      const targetUserId = participant.identity;

      console.log("[Media Control] Sending toggle camera command:", {
        roomId,
        userId: targetUserId,
        enabled: !currentlyEnabled,
      });

      sendMessage(wsEvents.toggleUserCamera, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: !currentlyEnabled,
        requesterId,
      });

      // Don't call participant.setCameraEnabled here!
      // It will be executed via WebSocket event handler
    } catch (error) {
      console.error("useMediaControls: Error toggling camera:", error);
    }
  }, [
    socket,
    isMyStream,
    isIGM,
    mediaState.isCameraEnabled,
    participant.identity,
    sendMessage,
    roomId,
    requesterId,
  ]);

  const toggleMicrophone = useCallback(() => {
    if (!socket) return;

    const canControl = isMyStream || isIGM;
    if (!canControl) return;

    try {
      const currentlyEnabled = mediaState.isMicrophoneEnabled;
      const targetUserId = participant.identity;

      console.log("[Media Control] Sending toggle microphone command:", {
        roomId,
        userId: targetUserId,
        enabled: !currentlyEnabled,
      });

      sendMessage(wsEvents.toggleUserMicrophone, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: !currentlyEnabled,
        requesterId,
      });

      // Don't call participant.setMicrophoneEnabled here!
      // It will be executed via WebSocket event handler
    } catch (error) {
      console.error("useMediaControls: Error toggling microphone:", error);
    }
  }, [
    socket,
    isMyStream,
    isIGM,
    mediaState.isMicrophoneEnabled,
    participant.identity,
    sendMessage,
    roomId,
    requesterId,
  ]);

  const canControl = isMyStream || isIGM;

  return {
    isCameraEnabled: mediaState.isCameraEnabled,
    isMicrophoneEnabled: mediaState.isMicrophoneEnabled,
    toggleCamera,
    toggleMicrophone,
    canControl,
  };
};
