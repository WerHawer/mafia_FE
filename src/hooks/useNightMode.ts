import { useCallback, useMemo } from "react";

import { rootStore } from "@/store/rootStore.ts";

export const useNightMode = () => {
  const { gamesStore, usersStore, isIDead } = rootStore;
  const { gameFlow, isUserGM } = gamesStore;
  const { myId } = usersStore;

  const isNight = gameFlow.isNight;
  const isGM = isUserGM(myId);

  // Перевіряємо, чи користувач прокинувся (в масиві wakeUp)
  const isAwake = useMemo(() => {
    if (isIDead) return false;

    const wakeUpArray = Array.isArray(gameFlow.wakeUp)
      ? gameFlow.wakeUp
      : gameFlow.wakeUp
        ? [gameFlow.wakeUp]
        : [];

    return wakeUpArray.includes(myId);
  }, [gameFlow.wakeUp, myId, isIDead]);

  // Вночі показуємо відео для:
  // 1. GM (завжди бачить все)
  // 2. Тих, хто прокинувся (в масиві wakeUp)
  const shouldShowVideos = !isNight || isGM || isAwake;

  // Чи показувати відео інших гравців
  const shouldShowPlayerVideo = useCallback(
    (participantId: string) => {
      // Відео GM показуємо завжди (незалежно від дня/ночі)
      if (isUserGM(participantId)) return true;

      // Вдень - показуємо всі відео
      if (!isNight) return true;

      // Вночі для GM - показуємо всі відео
      if (isGM) return true;

      // Вночі для тих, хто прокинувся - показуємо всі відео
      if (isAwake) return true;

      // Вночі для сплячих - не показуємо відео
      return false;
    },
    [isNight, isGM, isAwake, isUserGM]
  );

  // Звичайний гравець бачить своє відео за тими ж правилами, що й інші (вночі не бачить, якщо спить)
  const shouldShowMyVideo = myId ? shouldShowPlayerVideo(myId) : false;

  return {
    isNight,
    isGM,
    isAwake,
    shouldShowVideos,
    shouldShowMyVideo,
    shouldShowPlayerVideo,
  };
};
