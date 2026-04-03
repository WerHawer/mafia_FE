import { EyeOutlined, PlusCircleFilled } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import kissMarkIcon from "@/assets/icons/kiss_mark.png";
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
  const { sheriffCheck, donCheck, prostituteBlock, doctorSave } = gameFlow;

  const userCheckedBySheriff = sheriffCheck === userId;
  const userCheckedByDon = donCheck === userId;
  const userBlockedByProstitute = prostituteBlock === userId;
  const userSavedByDoctor = doctorSave === userId;

  if (!isIGM) return null;

  return (
    <div className={styles.gmIconsRow}>
      {userCheckedBySheriff && (
        <Tippy content={t("checkRole.checkedBySheriff")}>
          <EyeOutlined className={styles.gmIcon} style={{ color: '#5865f2' }} />
        </Tippy>
      )}

      {userCheckedByDon && (
        <Tippy content={t("checkRole.checkedByDon")}>
          <EyeOutlined className={styles.gmIcon} style={{ color: '#ffff27' }} />
        </Tippy>
      )}

      {userBlockedByProstitute && (
        <Tippy content={t("prostituteAction.blockedByProstitute")}>
          <img
            src={kissMarkIcon}
            alt="kiss"
            className={styles.gmIconImg}
          />
        </Tippy>
      )}

      {gameFlow.isNight && userSavedByDoctor && (
        <Tippy content={t("checkRole.doctorSavedGM")}>
          <PlusCircleFilled className={styles.gmIcon} style={{ color: '#52c41a' }} />
        </Tippy>
      )}
    </div>
  );
});
