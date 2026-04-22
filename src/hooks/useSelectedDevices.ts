import { useCallback, useState } from "react";

const STORAGE_PREFIX = "mafia_device";

const load = (key: string) =>
  localStorage.getItem(`${STORAGE_PREFIX}_${key}`) ?? "";

const save = (key: string, value: string) =>
  localStorage.setItem(`${STORAGE_PREFIX}_${key}`, value);

/**
 * Persists the user's preferred device IDs across page reloads.
 * Returns current IDs + setters for each device type.
 */
export const useSelectedDevices = () => {
  const [videoDeviceId, setVideoDeviceIdState] = useState<string>(
    () => load("video")
  );
  const [audioInputDeviceId, setAudioInputDeviceIdState] = useState<string>(
    () => load("audioInput")
  );
  const [audioOutputDeviceId, setAudioOutputDeviceIdState] = useState<string>(
    () => load("audioOutput")
  );

  const setVideoDevice = useCallback((id: string) => {
    save("video", id);
    setVideoDeviceIdState(id);
  }, []);

  const setAudioInputDevice = useCallback((id: string) => {
    save("audioInput", id);
    setAudioInputDeviceIdState(id);
  }, []);

  const setAudioOutputDevice = useCallback((id: string) => {
    save("audioOutput", id);
    setAudioOutputDeviceIdState(id);
  }, []);

  return {
    videoDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    setVideoDevice,
    setAudioInputDevice,
    setAudioOutputDevice,
  };
};
