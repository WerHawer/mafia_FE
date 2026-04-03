import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import styles from "./InvestigateEffect.module.scss";

type InvestigateEffectProps = {
  clickPosition?: { x: number; y: number } | null;
  result?: string | null;
  isDanger?: boolean;
};

export const InvestigateEffect = observer(({
  clickPosition,
  result,
  isDanger = false,
}: InvestigateEffectProps) => {
  const [showFlash, setShowFlash] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (result && clickPosition) {
      setShowFlash(true);
      setShowLabel(true);
      const flashTimer = setTimeout(() => setShowFlash(false), 1200);
      const labelTimer = setTimeout(() => setShowLabel(false), 3000);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(labelTimer);
      };
    }
  }, [result, clickPosition]);

  if (!result || !clickPosition) {
    return null;
  }

  const labelStyle = {
    left: `${clickPosition.x}%`,
    top: `${clickPosition.y}%`,
  };

  const borderClass = isDanger
    ? styles.borderFlashDanger
    : styles.borderFlashSafe;

  return (
    <>
      {showFlash && <div className={borderClass} />}
      {showLabel && (
        <div className={styles.container}>
          <div
            className={styles.resultLabel}
            style={labelStyle}
            data-danger={isDanger}
          >
            {result}
          </div>
        </div>
      )}
    </>
  );
});
