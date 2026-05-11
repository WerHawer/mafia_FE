import classNames from "classnames";
import { useEffect, useState } from "react";

import styles from "./SleepIcon.module.scss";

type SleepIconProps = {
  isVisible: boolean;
};

/**
 * SleepIcon — відображає анімований текст Zzz.
 * Показується всім (крім самого гравця) поверх відео гравця, який підтвердив сон.
 */
export const SleepIcon = ({ isVisible }: SleepIconProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsHiding(false);
    } else {
      setIsHiding(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Час анімації sleepFadeOut (0.4s)
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={classNames(styles.overlay, { [styles.hiding]: isHiding })}>
      <span className={styles.z}>z</span>
      <span className={styles.z}>z</span>
      <span className={styles.z}>Z</span>
    </div>
  );
};

SleepIcon.displayName = "SleepIcon";
