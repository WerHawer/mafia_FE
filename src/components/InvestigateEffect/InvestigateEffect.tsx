import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { Roles } from "@/types/game.types.ts";
import { RoleIcon } from "@/UI/RoleIcon";

import styles from "./InvestigateEffect.module.scss";

type InvestigateEffectProps = {
  clickPosition?: { x: number; y: number } | null;
  result?: string | null;
  /** @deprecated use isFound */
  isDanger?: boolean;
  isFound?: boolean;
  role?: Roles;
};

export const InvestigateEffect = observer(({
  clickPosition,
  result,
  isDanger = false,
  isFound = false,
  role,
}: InvestigateEffectProps) => {
  const [showFlash, setShowFlash] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // Backward compatibility or use isFound
  const activeFound = isFound || isDanger;

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

  const borderClass = activeFound
    ? styles.borderFlashSafe
    : styles.borderFlashDanger;

  return (
    <>
      {showFlash && <div className={borderClass} />}
      {showLabel && (
        <div className={styles.container}>
          <div
            className={styles.resultLabel}
            data-found={activeFound}
          >
            {role && (
              <div className={styles.roleIconWrapper}>
                <RoleIcon role={role} size="m" />
              </div>
            )}
            {result}
          </div>
        </div>
      )}
    </>
  );
});
