import { useRoomContext } from "@livekit/components-react";
import { LocalVideoTrack, Track } from "livekit-client";
import { useEffect, useState } from "react";

import { videoOptions } from "@/config/video.ts";
import { useConfigureVideo } from "@/hooks/useConfigureVideo.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const FPS = 30;

export const useCustomVideo = () => {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [videoSettings, setVideoSettings] = useState<UserVideoSettings>({
    withBlur: true,
    imageURL: "",
  });

  const room = useRoomContext();

  const originalStream = useUserMediaStream({
    audio: false,
    video: videoOptions,
  });

  const {
    setImageURL,
    setWithBlur,
    imageURL,
    withBlur,
    videoRef,
    imgRef,
    canvasRef,
  } = useConfigureVideo(videoSettings, originalStream);

  useEffect(() => {
    setVideoSettings({ withBlur, imageURL });
  }, [setVideoSettings, withBlur, imageURL]);

  useEffect(() => {
    if (!isSaved || !canvasRef.current || !originalStream || !room) return;

    if (room.state !== "connected") {
      return;
    }

    const canvas = canvasRef.current;
    const videoStream = canvas.captureStream(FPS);

    const [canvasVideoTrack] = videoStream.getVideoTracks();

    if (!canvasVideoTrack) {
      console.error("VideoConfig: No video track found in canvas stream");

      return;
    }

    const localVideoTrack = new LocalVideoTrack(canvasVideoTrack);

    const existingVideoTracks = Array.from(
      room.localParticipant.trackPublications.values()
    ).filter((pub) => pub.kind === Track.Kind.Video);

    const unpublishPromises = existingVideoTracks.map(async (publication) => {
      if (publication.track) {
        await room.localParticipant.unpublishTrack(publication.track);
      }
    });

    Promise.all(unpublishPromises)
      .then(() => {
        return room.localParticipant.publishTrack(localVideoTrack, {
          source: Track.Source.Camera, // Set source when publishing
        });
      })
      .catch((error) => {
        console.error("VideoConfig: Failed to replace video track:", error);
      });
  }, [canvasRef, isSaved, room, originalStream]);

  return {
    isStreamReady: !!originalStream,
    isSaved,
    setIsSaved,
    videoRef,
    imgRef,
    canvasRef,
    imageURL,
    setImageURL,
    withBlur,
    setWithBlur,
    videoSettings,
    setVideoSettings,
  };
};
