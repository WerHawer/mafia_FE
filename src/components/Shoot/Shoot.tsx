import { AimOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import bangIcon from "@/assets/icons/bang.png";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./Shoot.module.scss";

type ShootProps = {
  enabled: boolean;
  userId: UserId;
};

export const Shoot = observer(({ enabled, userId }: ShootProps) => {
  const { gamesStore, usersStore, isIGM } = rootStore;
  const { gameFlow } = gamesStore;
  const { myId } = usersStore;
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  // TODO: we can create animation and add sound for shooting
  const handleShoot = useCallback(() => {
    const isIHaveShoot = gameFlow.shoot?.some(
      ([shooterId]) => shooterId === myId,
    );

    if (isIHaveShoot) return;

    updateGameFlow({
      shoot: [...(gameFlow.shoot ?? []), [myId, userId]],
    });
  }, [gameFlow.shoot, myId, updateGameFlow, userId]);

  if (!enabled) return null;

  return (
    <div className={styles.container}>
      {!isIGM && <AimOutlined className={styles.icon} onClick={handleShoot} />}

      {isIGM &&
        gameFlow.shoot.map(([shooterId, targetId], index) =>
          targetId === userId ? (
            <img
              key={shooterId}
              src={bangIcon}
              alt="bang"
              className={classNames(styles.img, styles[`img${index}`])}
            />
          ) : null,
        )}
    </div>
  );
});
