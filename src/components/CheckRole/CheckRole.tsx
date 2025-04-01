import { EyeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Tippy from "@tippyjs/react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

import styles from "./CheckRole.module.scss";

type CheckRoleProps = {
  userId: UserId;
  enabled: boolean;
};

export const CheckRole = observer(({ userId, enabled }: CheckRoleProps) => {
  const { gamesStore, myRole, isIGM } = rootStore;
  const { getUserRole, gameFlow, isUserGM } = gamesStore;
  const [checkResult, setCheckResult] = useState("");
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const userRole = getUserRole(userId);
  const isISheriff = myRole === Roles.Sheriff;
  const isIDon = myRole === Roles.Don;
  const isUserSheriff = userRole === Roles.Sheriff;
  const isUserMafia = userRole === Roles.Mafia || userRole === Roles.Don;
  const userCheckedBySheriff = gameFlow.sheriffCheck === userId;
  const userCheckedByDon = gameFlow.donCheck === userId;

  const isCheckDisabled = useMemo(() => {
    if (isISheriff) {
      return !!gameFlow.sheriffCheck;
    }

    if (isIDon) {
      return !!gameFlow.donCheck;
    }

    return false;
  }, [gameFlow.donCheck, gameFlow.sheriffCheck, isIDon, isISheriff]);

  const handleCheckRole = useCallback(() => {
    if (isCheckDisabled) return;
    if (isUserGM(userId)) return;

    if (isISheriff) {
      const result = isUserMafia ? "Mafia" : "Not Mafia";
      setCheckResult(result);

      updateGameFlow({
        sheriffCheck: userId,
      });
      return;
    }

    if (isIDon) {
      const result = isUserSheriff ? "Sheriff" : "Not Sheriff";
      setCheckResult(result);

      updateGameFlow({
        donCheck: userId,
      });

      return;
    }
  }, [
    isCheckDisabled,
    isIDon,
    isISheriff,
    isUserGM,
    isUserMafia,
    isUserSheriff,
    updateGameFlow,
    userId,
  ]);

  return (
    <>
      {enabled && (
        <Tippy
          content={checkResult}
          trigger="click"
          placement="right"
          disabled={!checkResult && isCheckDisabled}
        >
          <QuestionCircleOutlined
            className={styles.icon}
            onClick={handleCheckRole}
          />
        </Tippy>
      )}

      {isIGM && userCheckedBySheriff && (
        <Tippy content="checked by sheriff">
          <EyeOutlined className={styles.sheriffCheckIcon} />
        </Tippy>
      )}

      {isIGM && userCheckedByDon && (
        <Tippy content="checked by don">
          <EyeOutlined
            className={classNames(
              styles.donCheckIcon,
              userCheckedBySheriff && userCheckedByDon && styles.doubleCheck,
            )}
          />
        </Tippy>
      )}
    </>
  );
});
