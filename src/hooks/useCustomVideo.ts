import { useCallback, useEffect, useState } from "react";

import { useConfigureVideo } from "@/hooks/useConfigureVideo.ts";
import { usePublishVideoTrack } from "@/hooks/usePublishVideoTrack.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

export const useCustomVideo = (
  originalStream: MediaStream | null,
  settings?: { withBlur: boolean; imageURL: string } | null
) => {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [videoSettings, setVideoSettings] = useState<UserVideoSettings>(
    settings ?? {
      withBlur: true,
      imageURL: "",
    }
  );

  const { publishVideoTrack } = usePublishVideoTrack();

  const {
    setImageURL,
    setWithBlur,
    imageURL,
    withBlur,
    videoRef,
    imgRef,
    canvasRef,
    isBackgroundReady,
  } = useConfigureVideo(videoSettings, originalStream);

  const applySettings = useCallback(
    (settings: UserVideoSettings) => {
      setVideoSettings(settings);
      setImageURL(settings.imageURL);
      setWithBlur(settings.withBlur);
      setIsSaved(true);
    },
    [setImageURL, setWithBlur]
  );

  useEffect(() => {
    setVideoSettings({ withBlur, imageURL });
  }, [setVideoSettings, withBlur, imageURL]);

  useEffect(() => {
    if (!canvasRef.current || !isSaved || !originalStream || !isBackgroundReady) return;

    void publishVideoTrack(canvasRef.current);
  }, [canvasRef, isSaved, originalStream, publishVideoTrack, isBackgroundReady]);

  return {
    isStreamReady: !!originalStream,
    isBackgroundReady,
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
    applySettings,
  };
};
