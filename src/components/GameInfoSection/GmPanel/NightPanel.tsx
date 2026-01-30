import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { NightRoles, Roles } from "@/types/game.types.ts";

import styles from "./GmPanel.module.scss";

export const NightPanel = observer(() => {
  const { t } = useTranslation();
  const { gamesStore } = rootStore;
  const { activeGameRoles, activeGameId, activeGameGm, gameFlow, nightRoles } =
    gamesStore;
  const { sendMessage } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const onRoleChange = useCallback(
    (role: NightRoles) => () => {
      let roleIds: string | string[] = activeGameRoles![role] ?? [];

      setSelectedRole(role);

      if (typeof roleIds === "string") {
        roleIds = [roleIds];
      }

      updateGameFlow({
        wakeUp: roleIds,
      });

      // if (gameFlow.day > 1 && selectedRole === Roles.Mafia) {
      //   sendMessage(wsEvents.wakeUp, {
      //     gameId: activeGameId,
      //     users: [],
      //     gm: activeGameGm,
      //   });
      //
      //   return;
      // }
      //
      // sendMessage(wsEvents.wakeUp, {
      //   gameId: activeGameId,
      //   users: roleIds,
      //   gm: activeGameGm,
      // });
    },
    [
      activeGameGm,
      activeGameId,
      activeGameRoles,
      gameFlow.day,
      selectedRole,
      sendMessage,
      updateGameFlow,
    ]
  );

  return (
    <div className={styles.nightContainer}>
      <span className={styles.wakeUpLabel}>{t("game.wakeUp")}</span>

      <div className={styles.rolesWrapper}>
        {nightRoles.map((role) => {
          return (
            <label className={styles.radioLabel} key={role}>
              <input
                type="radio"
                value={role}
                id={role}
                name="role"
                onChange={onRoleChange(role)}
                checked={role === selectedRole}
              />
              {role}
            </label>
          );
        })}
      </div>
    </div>
  );
});

NightPanel.displayName = "NightPanel";
