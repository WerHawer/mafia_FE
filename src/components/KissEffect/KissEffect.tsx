import { observer } from "mobx-react-lite";

import kissMarkIcon from "@/assets/icons/kiss_mark.png";
import { rootStore } from "@/store/rootStore.ts";

import styles from "./KissEffect.module.scss";

type KissEffectProps = {
  userId: string;
  clickPosition?: { x: number; y: number } | null;
};

export const KissEffect = observer(({ userId, clickPosition }: KissEffectProps) => {
  const { isIProstitute, isIGM, gamesStore } = rootStore;
  const { prostituteBlock, prostituteBlockPos, isNight } = gamesStore.gameFlow;

  const isBlocked = prostituteBlock === userId;

  // Visibility logic:
  // - Always visible during the day (!isNight)
  // - During the night, only the GM and the Prostitute can see it
  const canSee = !isNight || isIGM || isIProstitute || gamesStore.isMeObserver;

  // The kiss effect only appears if someone is blocked and the user is allowed to see it.
  if (!isBlocked || !canSee) {
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
