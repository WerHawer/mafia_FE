import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

import brokenGlassIcon from "@/assets/icons/broken_glass.png";
import { canSeeMafiaShot, isMafiaRole } from "@/helpers/mafiaShot.ts";
import { rootStore } from "@/store/rootStore.ts";
import { SoundEffect } from "@/store/soundStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./Shoot.module.scss";

type ShootProps = {
  userId: UserId;
  clickPosition?: { x: number; y: number } | null;
};

export const Shoot = observer(({ userId, clickPosition }: ShootProps) => {
  const { usersStore, gamesStore, myRole, soundStore, isIGM } = rootStore;
  const { gameFlow } = gamesStore;
  const { shoot = {} } = gameFlow;
  const { playSfx } = soundStore;

  const isIMafia = isMafiaRole(myRole);
  const canHearShot = isIMafia || isIGM || gamesStore.isMeObserver;
  const myId = usersStore.myId;
  const entry = shoot[userId];
  const serverShooters: UserId[] = entry?.shooters ?? [];
  const serverShots = entry?.shots ?? [];

  const prevShootersCount = useRef(serverShooters.length);

  useEffect(() => {
    const newShootersCount = serverShooters.length;
    if (newShootersCount > prevShootersCount.current && canHearShot) {
      // Check if the new shooter is me - if so, don't play sound (already played on click)
      const newShooter = serverShooters[newShootersCount - 1];
      const isMyShot = newShooter === myId;

      if (!isMyShot) {
        playSfx(SoundEffect.Shot, 0.7);
      }
    }
    prevShootersCount.current = newShootersCount;
  }, [serverShooters.length, playSfx, canHearShot, serverShooters, myId]);

  useEffect(() => {
    if (clickPosition && canHearShot) {
      playSfx(SoundEffect.Shot, 0.7);
    }
  }, [clickPosition, playSfx, canHearShot]);

  const shouldSeeShot = canSeeMafiaShot({ role: myRole, gameFlow });
  const hasAnything = !!clickPosition || serverShooters.length > 0;

  if (!shouldSeeShot || !hasAnything) return null;

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
        if (shooterId === myId && clickPosition) return null; // handled above

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
