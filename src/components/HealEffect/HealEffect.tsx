import { observer } from "mobx-react-lite";

import { rootStore } from "@/store/rootStore.ts";

import styles from "./HealEffect.module.scss";

type HealEffectProps = {
  userId: string;
  clickPosition?: { x: number; y: number } | null;
};

export const HealEffect = observer(({ userId, clickPosition }: HealEffectProps) => {
  const { isIDoctor, gamesStore } = rootStore;
  const { doctorSave } = gamesStore.gameFlow;

  const isSaved = doctorSave === userId;

  if (!isIDoctor || !isSaved || !clickPosition) {
    return null;
  }

  const style = { left: `${clickPosition.x}%`, top: `${clickPosition.y}%` };

  return (
    <div className={styles.container}>
      {/* Expanding healing rings */}
      <div className={styles.healPoint} style={style}>
        <div className={styles.ring} />
        <div className={styles.ringDelayed} />
        <div className={styles.ringSlower} />
        <div className={styles.glow} />
        <div className={styles.sparkles}>
          <span className={styles.sparkle} />
          <span className={styles.sparkle} />
          <span className={styles.sparkle} />
          <span className={styles.sparkle} />
          <span className={styles.sparkle} />
          <span className={styles.sparkle} />
        </div>
      </div>
    </div>
  );
});
