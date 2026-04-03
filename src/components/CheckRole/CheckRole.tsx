import { EyeOutlined, PlusCircleFilled, PlusCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import kissMarkIcon from "@/assets/icons/kiss_mark.png";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./CheckRole.module.scss";

type CheckRoleProps = {
  userId: UserId;
};

// TODO: refactor this component. Split into smaller components
export const CheckRole = observer(({ userId }: CheckRoleProps) => {
  const { t } = useTranslation();
  const { gamesStore, myRole, isIGM } = rootStore;
  const { getUserRole, gameFlow, isUserGM } = gamesStore;
  const { sheriffCheck, donCheck, prostituteBlock, doctorSave } = gameFlow;
  const [checkResult, setCheckResult] = useState("");
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const userRole = getUserRole(userId);
  const isISheriff = myRole === Roles.Sheriff;
  const isIDon = myRole === Roles.Don;
  const isUserSheriff = userRole === Roles.Sheriff;
  const isUserMafia = userRole === Roles.Mafia || userRole === Roles.Don;
  const userCheckedBySheriff = sheriffCheck === userId;
  const userCheckedByDon = donCheck === userId;
  const userBlockedByProstitute = prostituteBlock === userId;
  const userSavedByDoctor = doctorSave === userId;

  const isIDoctor = myRole === Roles.Doctor;
  const isMyStream = userId === rootStore.usersStore.myId;

  const isCheckDisabled = useMemo(() => {
    if (gameFlow.day < 2) return true;

    if (isISheriff) {
      return !!sheriffCheck;
    }

    if (isIDon) {
      return !!donCheck;
    }

    if (isIDoctor) {
      return !!doctorSave;
    }

    return false;
  }, [donCheck, gameFlow.day, isIDon, isISheriff, sheriffCheck, isIDoctor, doctorSave]);

  const onCheckRole = useCallback(() => {
    if (isCheckDisabled) return;
    if (isUserGM(userId)) return;
    if (isMyStream && !isIDoctor) return;

    if (isISheriff) {
      const result = isUserMafia
        ? t("checkRole.mafia")
        : t("checkRole.notMafia");
      setCheckResult(result);

      updateGameFlow({
        sheriffCheck: userId,
      });

      return;
    }

    if (isIDon) {
      const result = isUserSheriff
        ? t("checkRole.sheriff")
        : t("checkRole.notSheriff");
      setCheckResult(result);

      updateGameFlow({
        donCheck: userId,
      });

      return;
    }

    if (isIDoctor) {
      setCheckResult(t("checkRole.doctorSaved"));

      updateGameFlow({
        doctorSave: userId,
      });

      return;
    }
  }, [
    isCheckDisabled,
    isIDon,
    isISheriff,
    isIDoctor,
    isMyStream,
    isUserGM,
    isUserMafia,
    isUserSheriff,
    t,
    updateGameFlow,
    userId,
  ]);

  const showCheckIcon = isISheriff || isIDon || isIDoctor;

  return (
    <>
      {!isIGM && showCheckIcon && (
        <Tippy
          content={checkResult}
          theme="role-tooltip"
          trigger="click"
          placement="right"
          disabled={!checkResult && isCheckDisabled}
        >
          {isIDoctor ? (
            userSavedByDoctor ? (
              <PlusCircleFilled className={classNames(styles.icon, styles.doctorIcon)} />
            ) : (
              <PlusCircleOutlined className={classNames(styles.icon, styles.doctorIcon)} onClick={onCheckRole} />
            )
          ) : (
            <QuestionCircleOutlined className={styles.icon} onClick={onCheckRole} />
          )}
        </Tippy>
      )}

      {isIGM && (
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
      )}
    </>
  );
});
