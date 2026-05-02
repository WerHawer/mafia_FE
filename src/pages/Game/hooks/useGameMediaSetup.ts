import { useEffect, useRef, useState } from "react";
import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality.ts";
import { useSelectedDevices } from "@/hooks/useSelectedDevices.ts";
import { useUserMediaStream } from "@/hooks/useUserMediaStream.ts";
import { useVideoSettings } from "@/hooks/useVideoSettings.ts";

import aimCursorUrl from "@/assets/cursors/aim.svg?url";
import kissCursorUrl from "@/assets/cursors/kiss.svg?url";
import questionCursorUrl from "@/assets/cursors/question.svg?url";
import syringeCursorUrl from "@/assets/cursors/syringe.svg?url";
import brokenGlassIcon from "@/assets/icons/broken_glass.png";
import kissMarkIcon from "@/assets/icons/kiss_mark.png";

const PRELOAD_ASSETS = [
  brokenGlassIcon,
  kissMarkIcon,
  aimCursorUrl,
  kissCursorUrl,
  syringeCursorUrl,
  questionCursorUrl,
];

export const useGameMediaSetup = (gameId: string) => {
  const {
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
  } = useSelectedDevices();

  const quality = useAdaptiveQuality();

  const originalStream = useUserMediaStream({
    audio: true,
    video: {
      width: { ideal: quality.settings.width },
      height: { ideal: quality.settings.height },
      frameRate: { ideal: quality.settings.fps },
      ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {}),
    },
  });

  // Once we have the stream, verify the camera actually delivered the requested quality
  useEffect(() => {
    if (originalStream) quality.onStreamReady(originalStream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalStream]);

  const { getSavedSettings } = useVideoSettings(gameId);

  const [shouldShowVideoConfig, setShouldShowVideoConfig] = useState(false);
  const [shouldShowAudioConfig, setShouldShowAudioConfig] = useState(false);

  const firstStreamRef = useRef(false);

  useEffect(() => {
    if (!originalStream || firstStreamRef.current) return;
    firstStreamRef.current = true;

    const savedSettings = getSavedSettings();
    if (!savedSettings) {
      setShouldShowVideoConfig(true);
    }
  }, [originalStream, getSavedSettings]);

  // Preload visual effect images exactly once when page loads
  useEffect(() => {
    PRELOAD_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return {
    originalStream,
    quality,
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
    shouldShowVideoConfig,
    setShouldShowVideoConfig,
    shouldShowAudioConfig,
    setShouldShowAudioConfig,
  };
};
