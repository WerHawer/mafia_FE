import { useRoomContext } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const { isIDead, gamesStore } = rootStore;
  const { t } = useTranslation();
  const { socket, subscribe, sendMessage } = useSocket();
  const room = useRoomContext();
  const localParticipant = room.localParticipant;

  const getInitialMediaState = () => {
    const videoPublication = participant.getTrackPublication(Track.Source.Camera);
    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);

    return {
      isCameraEnabled: videoPublication ? !videoPublication.isMuted : true, // Default to true if not yet published
      isMicrophoneEnabled: audioPublication ? !audioPublication.isMuted : true,
    };
  };

  const [mediaState, setMediaState] = useState<MediaControlsState>(getInitialMediaState());

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

    const processCameraChange = async (userId: string, enabled: boolean, targetIdentity?: string) => {
      if (userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isCameraEnabled: enabled,
        }));
      }

      const isForMe =
        targetIdentity === myId ||
        targetIdentity === participant.identity ||
        (participant.isLocal && userId === myId);

      if (isForMe && participant.isLocal) {
        try {
          const videoPub = localParticipant.getTrackPublication(Track.Source.Camera);
          if (videoPub?.track) {
            if (enabled) {
              await videoPub.track.unmute();
            } else {
              await videoPub.track.mute();
            }
            console.log(
              `[Media Control] Canvas video track ${enabled ? "unmuted" : "muted"}`
            );
          } else {
            console.warn("[Media Control] No local camera track found to toggle");
          }
        } catch (error) {
          console.error("[Media Control] Error toggling camera:", error);
        }
      }
    };

    const handleCameraStatusChanged = async (data: {
      userId: string;
      participantIdentity: string;
      enabled: boolean;
      targetIdentity?: string;
    }) => {
      console.log("[Media Control] Camera status changed:", data);
      await processCameraChange(data.userId, data.enabled, data.targetIdentity);
    };

    const handleBatchCamerasStatusChanged = async (data: {
      userIds: string[];
      enabled: boolean;
    }) => {
      console.log("[Media Control] Batch cameras status changed:", data);
      if (data.userIds.includes(participant.identity)) {
        await processCameraChange(participant.identity, data.enabled, participant.identity);
      }
    };

    const processMicrophoneChange = async (
      userId: string,
      enabled: boolean,
      targetIdentity?: string,
      forceMute?: boolean
    ) => {
      if (forceMute !== undefined) {
        const wasForceMuted = gamesStore.isUserForceMuted(userId);

        if (wasForceMuted !== forceMute) {
          gamesStore.setForceMutedUser(userId, forceMute);
          
          if (userId === myId) {
            if (forceMute) {
              toast(t("mediaControls.forceMutedToast"), {
                icon: "🔒",
                id: "force-mute-status",
              });
            } else {
              toast.success(t("mediaControls.forceUnmutedToast"), {
                id: "force-mute-status",
              });
            }
          }
        }
      }

      if (userId === participant.identity) {
        setMediaState((prev) => ({
          ...prev,
          isMicrophoneEnabled: enabled,
        }));
      }

      const isForMe =
        targetIdentity === myId ||
        targetIdentity === participant.identity ||
        (participant.isLocal && userId === myId);

      if (isForMe && participant.isLocal) {
        try {
          const audioPub = localParticipant.getTrackPublication(Track.Source.Microphone);
          if (audioPub?.track) {
            if (enabled) {
              await audioPub.track.unmute();
            } else {
              await audioPub.track.mute();
            }
            console.log(
              `[Media Control] Microphone track ${enabled ? "unmuted" : "muted"}`
            );
          } else {
            await localParticipant.setMicrophoneEnabled(enabled);
          }
        } catch (error) {
          console.error("[Media Control] Error toggling microphone:", error);
        }
      }
    };

    const handleMicrophoneStatusChanged = async (data: {
      userId: string;
      participantIdentity: string;
      enabled: boolean;
      targetIdentity?: string;
      forceMute?: boolean;
    }) => {
      console.log("[Media Control] Microphone status changed:", data);
      await processMicrophoneChange(data.userId, data.enabled, data.targetIdentity, data.forceMute);
    };

    const handleBatchMicrophonesStatusChanged = async (data: {
      userIds: string[];
      enabled: boolean;
      forceMute?: boolean;
    }) => {
      console.log("[Media Control] Batch microphones status changed:", data);
      if (data.userIds.includes(participant.identity)) {
        await processMicrophoneChange(participant.identity, data.enabled, participant.identity, data.forceMute);
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
    const unsubscribeBatchCameras = subscribe(
      wsEvents.batchCamerasStatusChanged as any,
      handleBatchCamerasStatusChanged
    );
    const unsubscribeBatchMicrophones = subscribe(
      wsEvents.batchMicrophonesStatusChanged as any,
      handleBatchMicrophonesStatusChanged
    );

    return () => {
      unsubscribeCamera();
      unsubscribeMicrophone();
      unsubscribeBatchCameras();
      unsubscribeBatchMicrophones();
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
      const videoPub = participant.getTrackPublication(Track.Source.Camera);
      const currentlyEnabled = videoPub ? !videoPub.isMuted : mediaState.isCameraEnabled;
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

    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    const currentlyEnabled = audioPub ? !audioPub.isMuted : mediaState.isMicrophoneEnabled;
    const isTryingToUnmute = !currentlyEnabled;

    if (isTryingToUnmute && isMyStream && !isIGM) {
      const isForceMuted = gamesStore.isUserForceMuted(participant.identity);
      if (isForceMuted) {
        toast.error(t("mediaControls.forceMutedBlock"));
        return;
      }

      const isNight = gamesStore.gameFlow.isNight;
      if (isNight) {
        toast.error(t("mediaControls.nightMutedBlock"));
        return;
      }
    }

    const canControl = isMyStream || isIGM;
    if (!canControl) return;

    try {
      const targetUserId = participant.identity;

      console.log("[Media Control] Sending toggle microphone command:", {
        roomId,
        userId: targetUserId,
        enabled: isTryingToUnmute,
      });

      sendMessage(wsEvents.toggleUserMicrophone, {
        roomId,
        userId: targetUserId,
        participantIdentity: participant.identity,
        enabled: isTryingToUnmute,
        requesterId,
        // Optional: when GM clicks "mute", it's a regular mute, not force mute
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
    isIDead,
    gamesStore,
    mediaState.isMicrophoneEnabled,
    participant.identity,
    sendMessage,
    roomId,
    requesterId,
    t,
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
