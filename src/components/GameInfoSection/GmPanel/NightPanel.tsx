import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { NightRoles } from "@/types/game.types.ts";

import styles from "./NightPanel.module.scss";

const SLEEP_ALL = "sleepAll" as const;
type RoleSelection = NightRoles | typeof SLEEP_ALL;

export const NightPanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore } = rootStore;
  const { activeGameRoles, nightRoles } = gamesStore;
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(SLEEP_ALL);
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const onSelectRole = useCallback(
    (role: RoleSelection) => {
      // Clicking already active role puts everyone to sleep
      if (role === selectedRole || role === SLEEP_ALL) {
        setSelectedRole(SLEEP_ALL);
        updateGameFlow({ wakeUp: [] });
        return;
      }

      let roleIds: string | string[] =
        activeGameRoles![role as NightRoles] ?? [];

      if (typeof roleIds === "string") {
        roleIds = [roleIds];
      }

      setSelectedRole(role);
      updateGameFlow({ wakeUp: roleIds });
    },
    [activeGameRoles, selectedRole, updateGameFlow]
  );

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t("game.wakeUp")}</span>

      <button
        className={classNames(styles.roleButton, styles.sleepAll, {
          [styles.active]: selectedRole === SLEEP_ALL,
        })}
        onClick={() => onSelectRole(SLEEP_ALL)}
        type="button"
      >
        {selectedRole === SLEEP_ALL ? (
          <EyeInvisibleOutlined className={styles.eyeIcon} />
        ) : (
          <EyeInvisibleOutlined className={styles.eyeIcon} />
        )}
        {t("game.sleepAll")}
      </button>

      {nightRoles.map((role) => {
        const isActive = role === selectedRole;

        return (
          <button
            key={role}
            className={classNames(styles.roleButton, {
              [styles.active]: isActive,
            })}
            onClick={() => onSelectRole(role)}
            type="button"
          >
            {isActive ? (
              <EyeOutlined className={styles.eyeIcon} />
            ) : (
              <EyeInvisibleOutlined className={styles.eyeIcon} />
            )}
            {t(`roles.${role.toLowerCase()}`)}
          </button>
        );
      })}
    </div>
  );
});

NightPanel.displayName = "NightPanel";
