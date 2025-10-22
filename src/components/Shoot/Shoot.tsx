import { AimOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { useShootUserMutation } from "@/api/game/queries.ts";
import bangIcon from "@/assets/icons/bang.png";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./Shoot.module.scss";

type ShootProps = {
  userId: UserId;
};

export const Shoot = observer(({ userId }: ShootProps) => {
  const { gamesStore, usersStore, isIGM } = rootStore;
  const { gameFlow, activeGameId } = gamesStore;
  const { shoot = {} } = gameFlow;
  const { myId } = usersStore;
  const { mutate: shootUser } = useShootUserMutation();
  const isUserSooted = !!shoot[userId];

  // Nice to have: we can create animation and add sound for shooting
  const onShoot = useCallback(() => {
    if (!activeGameId) return;

    const isIShoot = Object.values(shoot).flat().includes(myId);

    if (isIShoot) return;

    shootUser({
      gameId: activeGameId,
      targetUserId: userId,
      shooterId: myId,
    });
  }, [activeGameId, myId, shoot, shootUser, userId]);

  // Mafia should see who shot whom
  return (
    <div className={styles.container}>
      {!isIGM && <AimOutlined className={styles.icon} onClick={onShoot} />}

      {isIGM && isUserSooted
        ? shoot[userId].map((shooterId, index) => (
            <img
              key={shooterId}
              src={bangIcon}
              alt="bang"
              className={classNames(styles.img, styles[`img${index}`])}
            />
          ))
        : null}
    </div>
  );
});
