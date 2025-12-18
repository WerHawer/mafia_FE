import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Typography } from "@/UI/Typography";

import styles from "./Timer.module.scss";

type TimerProps = {
  time?: number;
  resetTrigger?: boolean | string;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const Timer = memo(({ time = 60, resetTrigger }: TimerProps) => {
  const [diff, setDiff] = useState<number>(time);
  const [reset, setReset] = useState<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startTime = useMemo(() => Date.now(), [reset]);
  const endTime = useMemo(() => time * 1000 + startTime, [startTime, time]);

  const resetTime = useCallback(() => {
    setReset((prev) => !prev);
    setDiff(time);
  }, [time]);

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

  const formattedTime = formatTime(diff);
  const isTimeUp = diff === 0;
  const isLowTime = diff <= 10 && diff > 0;

  return (
    <div
      className={`${styles.timerContainer} ${isTimeUp ? styles.timeUp : ""} ${isLowTime ? styles.lowTime : ""}`}
    >
      <Typography variant="h2" className={styles.timerDisplay}>
        {formattedTime}
      </Typography>
    </div>
  );
});
