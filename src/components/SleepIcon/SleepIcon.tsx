import { useEffect, useState } from "react";
import classNames from "classnames";

import styles from "./SleepIcon.module.scss";

type SleepIconProps = {
  isVisible: boolean;
};

/**
 * SleepIcon — відображає анімований місяць та зірки.
 * Показується тільки ГМ поверх відео гравця, який підтвердив сон.
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
      }, 400); // Час анімації sleepFadeOut (0.4s)
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={classNames(styles.overlay, { [styles.hiding]: isHiding })}>
      <span className={styles.moon}>🌙</span>
      <div className={styles.stars}>
        <span className={styles.star}>✦</span>
        <span className={styles.star}>✦</span>
        <span className={styles.star}>✦</span>
      </div>
    </div>
  );
};

SleepIcon.displayName = "SleepIcon";
