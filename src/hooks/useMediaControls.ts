import { Participant, Track } from "livekit-client";
import { useCallback, useEffect, useState } from "react";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";

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
  const [mediaState, setMediaState] = useState<MediaControlsState>({
    isCameraEnabled: false,
    isMicrophoneEnabled: false,
  });

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

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleCameraStatusChanged = (data: {
      userId: string;
      enabled: boolean;
    }) => {
      if (data.userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isCameraEnabled: data.enabled,
        }));
      }
    };

    const handleMicrophoneStatusChanged = (data: {
      userId: string;
      enabled: boolean;
    }) => {
      if (data.userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isMicrophoneEnabled: data.enabled,
        }));
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
  }, [socket, participant.identity, subscribe]);

  const toggleCamera = useCallback(() => {
    if (!socket) return;

    const canControl = isMyStream || isIGM;
    if (!canControl) return;

    try {
      const currentlyEnabled = mediaState.isCameraEnabled;
      const targetUserId = participant.identity;

      sendMessage(wsEvents.toggleUserCamera, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: !currentlyEnabled,
        requesterId,
      });

      console.log("useMediaControls: Toggle camera request sent to server", {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: !currentlyEnabled,
        requesterId,
        isMyStream,
        isIGM,
        canControl,
      });
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

      sendMessage(wsEvents.toggleUserMicrophone, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: !currentlyEnabled,
        requesterId,
      });

      console.log(
        "useMediaControls: Toggle microphone request sent to server",
        {
          roomId,
          userId: targetUserId,
          participantIdentity: participant.identity,
          enabled: !currentlyEnabled,
          requesterId,
          isMyStream,
          isIGM,
          canControl,
        }
      );
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
