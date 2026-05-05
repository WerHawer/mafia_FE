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
  /** Великий центрований текст + іконка ролі (відеоплитки). Якщо false — лише миготлива рамка. */
  showCenterLabel?: boolean;
};

export const InvestigateEffect = observer(({
  clickPosition,
  result,
  isDanger = false,
  isFound = false,
  role,
  showCenterLabel = true,
}: InvestigateEffectProps) => {
  const [showFlash, setShowFlash] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // Backward compatibility or use isFound
  const activeFound = isFound || isDanger;

  useEffect(() => {
    if (result && clickPosition) {
      setShowFlash(true);
      setShowLabel(showCenterLabel);
      const flashTimer = setTimeout(() => setShowFlash(false), 1200);
      const labelTimer = showCenterLabel
        ? setTimeout(() => setShowLabel(false), 3000)
        : undefined;

      return (): void => {
        clearTimeout(flashTimer);
        if (labelTimer !== undefined) clearTimeout(labelTimer);
      };
    }

    return undefined;
  }, [result, clickPosition, showCenterLabel]);

  if (!result || !clickPosition) {
    return null;
  }

  const borderClass = activeFound
    ? styles.borderFlashSafe
    : styles.borderFlashDanger;

  return (
    <>
      {showFlash && <div className={borderClass} />}
      {showCenterLabel && showLabel ? (
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
      ) : null}
    </>
  );
});
