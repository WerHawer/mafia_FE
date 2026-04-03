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
  const { usersStore, gamesStore, myRole, isIGM } = rootStore;
  const { gameFlow } = gamesStore;
  const { shoot = {} } = gameFlow;
  
  const isIMafia = myRole === Roles.Mafia || myRole === Roles.Don;
  const entry = shoot[userId];
  const isUserShot = !!entry?.shooters?.length;
  const shouldSeeShot = isIGM || isIMafia;

  if (!shouldSeeShot || !isUserShot) {
    return null;
  }

  const { shooters, shots } = entry;

  return (
    <div className={styles.container}>
      {shooters.map((shooterId, index) => {
        const isMyShot = shooterId === usersStore.myId;
        const shotCoords = isMyShot && clickPosition
          ? clickPosition
          : shots[index];
        
        const style = shotCoords
          ? { left: `${shotCoords.x}%`, top: `${shotCoords.y}%` }
          : {};

        return (
          <img
            key={shooterId}
            src={brokenGlassIcon}
            alt="shot"
            className={classNames(styles.img, styles[`img${index}`])}
            style={style}
          />
        );
      })}
    </div>
  );
});
