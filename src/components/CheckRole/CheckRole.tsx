import { EyeOutlined, LockOutlined, QuestionCircleOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./CheckRole.module.scss";

type CheckRoleProps = {
  userId: UserId;
};

export const CheckRole = observer(({ userId }: CheckRoleProps) => {
  const { t } = useTranslation();
  const { gamesStore, myRole, isIGM, isIProstitute } = rootStore;
  const { getUserRole, gameFlow, isUserGM } = gamesStore;
  const { sheriffCheck, donCheck, prostituteBlock } = gameFlow;
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

  const isMyStream = userId === rootStore.usersStore.myId;

  const isCheckDisabled = useMemo(() => {
    if (gameFlow.day < 2) return true;

    if (isISheriff) {
      return !!sheriffCheck;
    }

    if (isIDon) {
      return !!donCheck;
    }

    if (isIProstitute) {
      return !!prostituteBlock;
    }

    return false;
  }, [donCheck, gameFlow.day, isIDon, isISheriff, isIProstitute, prostituteBlock, sheriffCheck]);

  const onCheckRole = useCallback(() => {
    if (isCheckDisabled) return;
    if (isUserGM(userId)) return;
    if (isMyStream) return;

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

    if (isIProstitute) {
      setCheckResult(t("prostituteAction.blocked"));

      updateGameFlow({
        prostituteBlock: userId,
      });

      return;
    }
  }, [
    isCheckDisabled,
    isIDon,
    isISheriff,
    isIProstitute,
    isMyStream,
    isUserGM,
    isUserMafia,
    isUserSheriff,
    t,
    updateGameFlow,
    userId,
  ]);

  const showCheckIcon = isISheriff || isIDon || isIProstitute;

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
          {isIProstitute ? (
            userBlockedByProstitute ? (
              <HeartFilled className={styles.icon} style={{ color: "#e91e8c" }} />
            ) : (
              <HeartOutlined className={styles.icon} onClick={onCheckRole} style={{ color: "#e91e8c" }} />
            )
          ) : (
            <QuestionCircleOutlined className={styles.icon} onClick={onCheckRole} />
          )}
        </Tippy>
      )}

      {isIGM && userCheckedBySheriff && (
        <Tippy content={t("checkRole.checkedBySheriff")}>
          <EyeOutlined className={styles.sheriffCheckIcon} />
        </Tippy>
      )}

      {isIGM && userCheckedByDon && (
        <Tippy content={t("checkRole.checkedByDon")}>
          <EyeOutlined
            className={classNames(
              styles.donCheckIcon,
              userCheckedBySheriff && userCheckedByDon && styles.doubleCheck
            )}
          />
        </Tippy>
      )}

      {isIGM && userBlockedByProstitute && (
        <Tippy content={t("prostituteAction.blockedByProstitute")}>
          <LockOutlined className={styles.prostituteBlockIcon} />
        </Tippy>
      )}
    </>
  );
});
