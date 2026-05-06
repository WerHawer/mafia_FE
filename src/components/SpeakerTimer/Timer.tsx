import classNames from "classnames";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { getAudioPath } from "@/helpers/getAudioPath";
import { soundStore, SoundEffect } from "@/store/soundStore.ts";
import { Typography } from "@/UI/Typography";

import styles from "./Timer.module.scss";

export enum TimerSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
  XL = "xl",
}

type TimerProps = {
  time?: number;
  /**
   * Optional absolute server-stamped end time (Unix ms). When provided the
   * timer counts down to this fixed moment so all clients stay in sync,
   * regardless of when they received the WebSocket event.
   * Falls back to `time`-based countdown when absent or null.
   */
  serverEndTime?: number | null;
  resetTrigger?: boolean | string;
  size?: TimerSize;
  onTimerStart?: () => void;
  onLowTime?: () => void;
  onTimeUp?: () => void;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const Timer = memo(
  ({ time = 60, serverEndTime, resetTrigger, size = TimerSize.Medium, onTimerStart, onLowTime, onTimeUp }: TimerProps) => {
    const [diff, setDiff] = useState<number>(time);
    const [reset, setReset] = useState<boolean>(false);
    const [hasCalledTimeUp, setHasCalledTimeUp] = useState<boolean>(false);
    const [hasCalledLowTime, setHasCalledLowTime] = useState<boolean>(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const startTime = useMemo(() => Date.now(), [reset]);

    // When serverEndTime is provided we use it as the absolute end-point so that
    // all clients count down to the same moment, regardless of network lag.
    const endTime = useMemo(
      () => (serverEndTime != null ? serverEndTime : time * 1000 + startTime),
      [startTime, time, serverEndTime]
    );

    const resetTime = useCallback(() => {
      setReset((prev) => !prev);
      // Derive initial seconds from server end-time when available so the
      // timer starts at the correct remaining value (not the full duration).
      const initialDiff =
        serverEndTime != null
          ? Math.ceil(Math.max(0, serverEndTime - Date.now()) / 1000)
          : time;
      setDiff(initialDiff);
      setHasCalledTimeUp(false);
      setHasCalledLowTime(false);
      onTimerStart?.();
    }, [time, serverEndTime, onTimerStart]);

    useEffect(() => {
      if (serverEndTime == null) {

        return;
      }

      setDiff(Math.ceil(Math.max(0, serverEndTime - Date.now()) / 1000));
    }, [serverEndTime]);

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

    useEffect(() => {
      if (diff === 0 && !hasCalledTimeUp) {
        setHasCalledTimeUp(true);
        if (onTimeUp) {
          onTimeUp();
        }

        // Play alarm 2 times
        if (!soundStore.isMuted) {
          try {
            const audioPath = getAudioPath(SoundEffect.Alarm);
            const audio = new Audio(audioPath);
            audio.volume = soundStore.effectiveSfxVolume;
            let plays = 0;
            audio.onended = () => {
              plays++;
              if (plays < 2) {
                void audio.play();
              }
            };
            void audio.play();
          } catch (e) {
            console.error("Failed to play alarm", e);
          }
        }
      }
    }, [diff, hasCalledTimeUp, onTimeUp]);

    const isLowTime = diff <= 10 && diff > 0;

    useEffect(() => {
      if (isLowTime && !hasCalledLowTime && onLowTime) {
        setHasCalledLowTime(true);
        onLowTime();
      }
    }, [isLowTime, hasCalledLowTime, onLowTime]);

    const formattedTime = formatTime(diff);
    const isTimeUp = diff === 0;

    return (
      <div
        className={classNames(styles.timerContainer, styles[size], {
          [styles.timeUp]: isTimeUp,
          [styles.lowTime]: isLowTime,
        })}
      >
        <Typography variant="h3" className={styles.timerDisplay}>
          {formattedTime}
        </Typography>
      </div>
    );
  }
);
