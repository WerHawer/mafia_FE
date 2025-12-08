import { useCallback } from "react";

import { useStorage } from "@/hooks/useStorage.ts";
import { UserVideoSettings } from "@/types/user.types.ts";

const VIDEO_SETTINGS_PREFIX = "videoConfig_";

export const useVideoSettings = (gameId: string) => {
  const storageKey = `${VIDEO_SETTINGS_PREFIX}${gameId}`;
  const { getItem, setItem, removeItem } = useStorage<UserVideoSettings>(
    storageKey,
    "local"
  );

  const getSavedSettings = useCallback((): UserVideoSettings | null => {
    return getItem();
  }, [getItem]);

  const saveSettings = useCallback(
    (settings: UserVideoSettings): void => {
      setItem(settings);
    },
    [setItem]
  );

  const clearSettings = useCallback((): void => {
    removeItem();
  }, [removeItem]);

  const hasSavedSettings = useCallback((): boolean => {
    return getSavedSettings() !== null;
  }, [getSavedSettings]);

  return {
    getSavedSettings,
    saveSettings,
    clearSettings,
    hasSavedSettings,
  };
};
