import classNames from "classnames";
import { observer } from "mobx-react-lite";

import brokenGlassIcon from "@/assets/icons/broken_glass.png";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./Shoot.module.scss";

type ShootProps = {
  userId: UserId;
  clickPosition?: { x: number; y: number } | null;
};

export const Shoot = observer(({ userId, clickPosition }: ShootProps) => {
  const { usersStore, gamesStore, myRole } = rootStore;
  const { gameFlow } = gamesStore;
  const { shoot = {} } = gameFlow;

  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const entry = shoot[userId];
  const serverShooters = entry?.shooters ?? [];
  const serverShots = entry?.shots ?? [];

  const shouldSeeShot = isIMafia;
  const hasAnything = !!clickPosition || serverShooters.length > 0;

  if (!shouldSeeShot || !hasAnything) return null;

  const myId = usersStore.myId;
  const mafiaIds = gamesStore.activeGameRoles?.mafia ?? [];

  const getVariantClass = (id: UserId) => {
    const mafiaIndex = mafiaIds.indexOf(id);
    if (mafiaIndex === 1) return styles.img1;
    if (mafiaIndex === 2) return styles.img2;
    return null;
  };

  const optimisticStyle = clickPosition
    ? { left: `${clickPosition.x}%`, top: `${clickPosition.y}%` }
    : undefined;

  return (
    <div className={styles.container}>
      {/* My shot — always from local clickPosition to avoid flicker on server round-trip */}
      {optimisticStyle && (
        <img
          src={brokenGlassIcon}
          alt="shot"
          className={classNames(styles.img, getVariantClass(myId))}
          style={optimisticStyle}
        />
      )}

      {/* Other shooters — from server data, skip my own id */}
      {serverShooters.map((shooterId, index) => {
        if (shooterId === myId) return null; // handled above

        const coords = serverShots[index];
        const style = coords ? { left: `${coords.x}%`, top: `${coords.y}%` } : {};

        return (
          <img
            key={shooterId}
            src={brokenGlassIcon}
            alt="shot"
            className={classNames(styles.img, getVariantClass(shooterId))}
            style={style}
          />
        );
      })}
    </div>
  );
});
