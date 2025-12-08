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
  } = useConfigureVideo(videoSettings, originalStream);

  useEffect(() => {
    setVideoSettings({ withBlur, imageURL });
  }, [setVideoSettings, withBlur, imageURL]);

  useEffect(() => {
    if (!isSaved || !canvasRef.current || !originalStream) return;

    void publishVideoTrack(canvasRef.current);
  }, [canvasRef, isSaved, originalStream, publishVideoTrack]);

  const applySettings = useCallback(
    (settings: UserVideoSettings) => {
      setImageURL(settings.imageURL);
      setWithBlur(settings.withBlur);
      setVideoSettings(settings);

      setIsSaved(true);
    },
    [setImageURL, setWithBlur]
  );

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
    applySettings,
  };
};
