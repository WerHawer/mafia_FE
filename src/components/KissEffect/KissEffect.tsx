import { observer } from "mobx-react-lite";

import kissMarkIcon from "@/assets/icons/kiss_mark.png";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./KissEffect.module.scss";

type KissEffectProps = {
  userId: string;
  clickPosition?: { x: number; y: number } | null;
};

export const KissEffect = observer(({ userId, clickPosition }: KissEffectProps) => {
  const { isIProstitute, gamesStore } = rootStore;
  const { prostituteBlock } = gamesStore.gameFlow;

  const isBlocked = prostituteBlock === userId;

  if (!isIProstitute || !isBlocked || !clickPosition) {
    return null;
  }

  const style = { left: `${clickPosition.x}%`, top: `${clickPosition.y}%` };

  return (
    <div className={styles.container}>
      <img
        src={kissMarkIcon}
        alt="kiss"
        className={styles.kissImg}
        style={style}
      />
    </div>
  );
});
