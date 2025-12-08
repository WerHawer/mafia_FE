import { useCallback } from "react";

type StorageType = "local" | "session";

export const useStorage = <T>(
  key: string,
  storageType: StorageType = "local"
) => {
  const storage =
    storageType === "local" ? window.localStorage : window.sessionStorage;

  const getItem = useCallback((): T | null => {
    try {
      const item = storage.getItem(key);

      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${storageType}Storage key "${key}":`, error);

      return null;
    }
  }, [key, storage, storageType]);

  const setItem = useCallback(
    (value: T): void => {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(
          `Error setting ${storageType}Storage key "${key}":`,
          error
        );
      }
    },
    [key, storage, storageType]
  );

  const removeItem = useCallback((): void => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(
        `Error removing ${storageType}Storage key "${key}":`,
        error
      );
    }
  }, [key, storage, storageType]);

  const clear = useCallback((): void => {
    try {
      storage.clear();
    } catch (error) {
      console.error(`Error clearing ${storageType}Storage:`, error);
    }
  }, [storage, storageType]);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
};
