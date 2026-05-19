import { useCallback, useEffect, useState } from "react";

import { QualitySettings } from "@/config/video.ts";
import { useConfigureVideo } from "@/hooks/useConfigureVideo.ts";
import { useConfigureVideoWebGL } from "@/hooks/useConfigureVideoWebGL.ts";
import { usePublishVideoTrack } from "@/hooks/usePublishVideoTrack.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

export const useCustomVideo = (
  originalStream: MediaStream | null,
  settings?: { withBlur: boolean; imageURL: string } | null,
  qualitySettings?: QualitySettings
) => {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [videoSettings, setVideoSettings] = useState<UserVideoSettings>(
    settings ?? {
      withBlur: true,
      imageURL: "",
    }
  );

  const { publishVideoTrack } = usePublishVideoTrack(qualitySettings);

  const [webGLFailed, setWebGLFailed] = useState(false);
  const onWebGLFatal = useCallback(() => setWebGLFailed(true), []);

  const webGLProps = useConfigureVideoWebGL(
    videoSettings,
    !webGLFailed ? originalStream : null,
    qualitySettings,
    onWebGLFatal
  );

  const canvasProps = useConfigureVideo(
    videoSettings,
    webGLFailed ? originalStream : null,
    qualitySettings
  );

  const activeProps = webGLFailed ? canvasProps : webGLProps;

  const {
    setImageURL,
    setWithBlur,
    imageURL,
    withBlur,
    videoRef,
    imgRef,
    canvasRef,
    isBackgroundReady,
  } = activeProps;

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
    canvasKey: webGLFailed ? "2d" : "webgl",
  };
};
