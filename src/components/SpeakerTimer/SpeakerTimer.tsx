import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { useCallback, useEffect, useState } from "react";

export const SpeakerTimer = observer(() => {
  const { gameFlow } = gamesStore;
  const [time, setTime] = useState<number>(gameFlow.speakTime);

  const resetTime = useCallback(() => {
    setTime(gameFlow.speakTime);
  }, [gameFlow.speakTime]);

  useEffect(() => {
    resetTime();
  }, [gameFlow.speaker, resetTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [resetTime]);

  return <span>{time}</span>;
});
