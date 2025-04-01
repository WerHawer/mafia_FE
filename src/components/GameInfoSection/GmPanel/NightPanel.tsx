import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useState } from "react";

import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { useSocket } from "@/hooks/useSocket.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

import styles from "./GmPanel.module.scss";

export const NightPanel = observer(() => {
  const { gamesStore } = rootStore;
  const { activeGameRoles, activeGameId, activeGameGm, gameFlow } = gamesStore;
  const { sendMessage } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const existingActiveRoles = activeGameRoles
    ? Object.entries(activeGameRoles)
        .filter(([key, value]) => Boolean(value) && key !== Roles.Citizen)
        .map(([key]) => key)
    : [];

  const handleRoleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedRole = e.target.value as Exclude<
        Roles,
        Roles.Unknown | Roles.GM
      >;

      const roleIds: string | string[] = activeGameRoles![selectedRole] ?? "";

      setSelectedRole(selectedRole);

      updateGameFlow({
        wakeUp: roleIds,
      });

      if (gameFlow.day > 1 && selectedRole === Roles.Mafia) {
        sendMessage(wsEvents.wakeUp, {
          gameId: activeGameId,
          users: [],
          gm: activeGameGm,
        });

        return;
      }

      sendMessage(wsEvents.wakeUp, {
        gameId: activeGameId,
        users: roleIds,
        gm: activeGameGm,
      });
    },
    [
      activeGameGm,
      activeGameId,
      activeGameRoles,
      gameFlow.day,
      sendMessage,
      updateGameFlow,
    ]
  );

  return (
    <div className={styles.nightContainer}>
      <span>Wake up:</span>
      {existingActiveRoles.map((role) => {
        return (
          <label className={styles.radioLabel} key={role}>
            <input
              type="radio"
              value={role}
              id={role}
              name="role"
              onChange={handleRoleChange}
              checked={role === selectedRole}
            />{" "}
            {role}
          </label>
        );
      })}
    </div>
  );
});

NightPanel.displayName = "NightPanel";
