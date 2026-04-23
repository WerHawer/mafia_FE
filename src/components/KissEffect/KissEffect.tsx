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
  const { prostituteBlock, prostituteBlockPos } = gamesStore.gameFlow;

  const isBlocked = prostituteBlock === userId;

  // The kiss effect only appears if someone is blocked.
  if (!isBlocked) {
    return null;
  }

  // Use the local click position if available (for the prostitute) to avoid flicker.
  // Otherwise use the server-synced position. If neither is available, center it.
  const posX = clickPosition?.x ?? prostituteBlockPos?.x ?? 50;
  const posY = clickPosition?.y ?? prostituteBlockPos?.y ?? 50;

  const style = { left: `${posX}%`, top: `${posY}%` };

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
