import { EyeOutlined, PlusCircleFilled } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import bulletIcon from "@/assets/icons/bullet.png";
import { rootStore } from "@/store/rootStore.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./CheckRole.module.scss";

type CheckRoleProps = {
  userId: UserId;
};

export const CheckRole = observer(({ userId }: CheckRoleProps) => {
  const { t } = useTranslation();
  const { gamesStore, isIGM } = rootStore;
  const { gameFlow } = gamesStore;
  const { sheriffCheck, donCheck, prostituteBlock, doctorSave, shoot = {} } = gameFlow;

  const userCheckedBySheriff = sheriffCheck === userId;
  const userCheckedByDon = donCheck === userId;
  const userSavedByDoctor = doctorSave === userId;
  const shotCount = shoot[userId]?.shooters?.length ?? 0;

  if (!isIGM && !gamesStore.isMeObserver) return null;

  return (
    <div className={classNames(styles.gmIconsRow, { [styles.night]: gameFlow.isNight })}>
      {shotCount > 0 && (
        <Tippy theme="role-tooltip" content={t("checkRole.shotByMafia", { count: shotCount })}>
          <div className={styles.gmIconWrapper}>
            <img
              src={bulletIcon}
              alt="shot"
              className={styles.gmIconImg}
            />
            {shotCount > 1 && (
              <span className={styles.badge}>{shotCount}</span>
            )}
          </div>
        </Tippy>
      )}

      {userCheckedBySheriff && (
        <Tippy theme="role-tooltip" content={t("checkRole.checkedBySheriff")}>
          <EyeOutlined className={styles.gmIcon} style={{ color: '#5865f2' }} />
        </Tippy>
      )}

      {userCheckedByDon && (
        <Tippy theme="role-tooltip" content={t("checkRole.checkedByDon")}>
          <EyeOutlined className={styles.gmIcon} style={{ color: '#ffff27' }} />
        </Tippy>
      )}

      {gameFlow.isNight && userSavedByDoctor && (
        <Tippy theme="role-tooltip" content={t("checkRole.doctorSavedGM")}>
          <PlusCircleFilled className={styles.gmIcon} style={{ color: '#52c41a' }} />
        </Tippy>
      )}
    </div>
  );
});
