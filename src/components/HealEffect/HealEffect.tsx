import { observer } from "mobx-react-lite";

import tapeImageUrl from "@/assets/icons/tape.png";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./HealEffect.module.scss";

type HealEffectProps = {
  userId: string;
  clickPosition?: { x: number; y: number } | null;
};

export const HealEffect = observer(({ userId, clickPosition }: HealEffectProps) => {
  const { isIDoctor, gamesStore } = rootStore;
  const { doctorSave, isNight } = gamesStore.gameFlow;

  const isSaved = doctorSave === userId;

  if (!isIDoctor || !isNight || !isSaved) {

    return null;
  }

  const posX = clickPosition?.x ?? 50;
  const posY = clickPosition?.y ?? 50;
  const style = { left: `${posX}%`, top: `${posY}%` };

  return (
    <div className={styles.container}>
      <div className={styles.healPoint} style={style}>
        <div className={styles.tapeShell}>
          <img
            src={tapeImageUrl}
            alt=""
            className={styles.tapeImg}
          />
        </div>
      </div>
    </div>
  );
});
