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
  const { isIDead } = rootStore;
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
        isCameraEnabled: videoPublication ? !videoPublication.isMuted : false,
        isMicrophoneEnabled: audioPublication ? !audioPublication.isMuted : false,
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
          // We use a canvas-based video track (not the native camera).
          // setCameraEnabled() would try to open the real camera — we must NOT call it.
          // Instead, mute/unmute the already-published track directly.
          const videoPub = localParticipant.getTrackPublication(Track.Source.Camera);
          if (videoPub?.track) {
            if (data.enabled) {
              await videoPub.track.unmute();
            } else {
              await videoPub.track.mute();
            }
            console.log(
              `[Media Control] Canvas video track ${data.enabled ? "unmuted" : "muted"}`
            );
          } else {
            console.warn("[Media Control] No local camera track found to toggle");
          }
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
          // Use direct track muting to avoid triggering getUserMedia again.
          const audioPub = localParticipant.getTrackPublication(Track.Source.Microphone);
          if (audioPub?.track) {
            if (data.enabled) {
              await audioPub.track.unmute();
            } else {
              await audioPub.track.mute();
            }
            console.log(
              `[Media Control] Microphone track ${data.enabled ? "unmuted" : "muted"}`
            );
          } else {
            // Fallback: if no track yet (e.g. mic not yet published), let LiveKit handle it
            await localParticipant.setMicrophoneEnabled(data.enabled);
          }
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

  // Handle automatic microphone turn-off when player dies
  useEffect(() => {
    if (isMyStream && isIDead && mediaState.isMicrophoneEnabled && socket) {
      console.log("[Media Control] Auto-disabling microphone for dead player");
      
      const targetUserId = participant.identity;
      sendMessage(wsEvents.toggleUserMicrophone, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: false,
        requesterId,
      });
    }
  }, [isMyStream, isIDead, mediaState.isMicrophoneEnabled, socket, participant.identity, roomId, requesterId, sendMessage]);

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
    if (isIDead && isMyStream) {
      console.log("[Media Control] Cannot toggle microphone: player is dead");
      return;
    }

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
