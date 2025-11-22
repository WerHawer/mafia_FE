import { useCallback, useMemo } from "react";

import { rootStore } from "@/store/rootStore.ts";

export const useNightMode = () => {
  const { gamesStore, usersStore } = rootStore;
  const { gameFlow, isUserGM } = gamesStore;
  const { myId } = usersStore;

  const isNight = gameFlow.isNight;
  const isGM = isUserGM(myId);

  // Перевіряємо, чи користувач прокинувся (в масиві wakeUp)
  const isAwake = useMemo(() => {
    const wakeUpArray = Array.isArray(gameFlow.wakeUp)
      ? gameFlow.wakeUp
      : gameFlow.wakeUp
        ? [gameFlow.wakeUp]
        : [];

    return wakeUpArray.includes(myId);
  }, [gameFlow.wakeUp, myId]);

  // Вночі показуємо відео для:
  // 1. GM (завжди бачить все)
  // 2. Тих, хто прокинувся (в масиві wakeUp)
  const shouldShowVideos = !isNight || isGM || isAwake;

  // Своє відео можна показувати завжди
  const shouldShowMyVideo = true;

  // Чи показувати відео інших гравців
  const shouldShowPlayerVideo = useCallback(
    (_participantId: string) => {
      // Вдень - показуємо всі відео
      if (!isNight) return true;

      // Вночі для GM - показуємо всі відео
      if (isGM) return true;

      // Вночі для тих, хто прокинувся - показуємо всі відео
      if (isAwake) return true;

      // Вночі для сплячих - не показуємо відео
      return false;
    },
    [isNight, isGM, isAwake]
  );

  return {
    isNight,
    isGM,
    isAwake,
    shouldShowVideos,
    shouldShowMyVideo,
    shouldShowPlayerVideo,
  };
};
