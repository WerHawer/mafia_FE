import { memo, useCallback, useEffect, useState } from "react";

type TimerProps = {
  timer?: number;
  resetTrigger?: boolean | string;
};

export const Timer = memo(({ timer = 60, resetTrigger }: TimerProps) => {
  const [time, setTime] = useState<number>(timer);

  const resetTime = useCallback(() => {
    setTime(timer);
  }, [timer]);

  useEffect(() => {
    resetTime();
  }, [resetTrigger, resetTime]);

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
