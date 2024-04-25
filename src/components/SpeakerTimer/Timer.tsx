import { memo, useCallback, useEffect, useMemo, useState } from "react";

type TimerProps = {
  timer?: number;
  resetTrigger?: boolean | string;
};

export const Timer = memo(({ timer = 60, resetTrigger }: TimerProps) => {
  const [diff, setDiff] = useState<number>(timer);
  const [reset, setReset] = useState<boolean>(false);

  const startTime = useMemo(() => Date.now(), [reset]);
  const endTime = useMemo(() => timer * 1000 + startTime, [startTime, timer]);

  const resetTime = useCallback(() => {
    setReset((prev) => !prev);
    setDiff(timer);
  }, [timer]);

  useEffect(() => {
    resetTime();
  }, [resetTrigger, resetTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const diff = Math.round((endTime - currentTime) / 1000);

      setDiff(diff <= 0 ? 0 : diff);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [endTime]);

  return <span>{diff}</span>;
});
