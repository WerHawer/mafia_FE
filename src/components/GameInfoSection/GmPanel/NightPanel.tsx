import styles from "./GmPanel.module.scss";
import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { ChangeEvent, useCallback, useState } from "react";
import { useSocket } from "@/hooks/useSocket.ts";
import { wsEvents } from "@/config/wsEvents.ts";
import { Roles } from "@/types/game.types.ts";
import { useUpdateGameFlowMutation } from "@/api/game/queries.ts";

export const NightPanel = observer(() => {
  const { activeGameRoles, activeGameId, activeGameGm, gameFlow } = gamesStore;
  const { sendMessage } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);
  const { mutate: updateGameFlow } = useUpdateGameFlowMutation();

  const existingActiveRoles = activeGameRoles
    ? Object.entries(activeGameRoles)
        .filter(([key, value]) => Boolean(value) && key !== Roles.Citizens)
        .map(([key]) => key)
    : [];

  const handleRoleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedRole = e.target.value as Exclude<Roles, Roles.Unknown>;

      const roleIds = activeGameRoles![selectedRole] ?? "";

      setSelectedRole(selectedRole);

      updateGameFlow({
        wakeUp: roleIds,
      });
      sendMessage(wsEvents.wakeUp, {
        gameId: activeGameId,
        users: roleIds,
        gm: activeGameGm,
      });
    },
    [activeGameGm, activeGameId, activeGameRoles, sendMessage, updateGameFlow],
  );

  return (
    <div className={styles.nightContainer}>
      <span>Wake up:</span>
      {existingActiveRoles.map((role) => {
        if (gameFlow.day !== 1 && role === Roles.Mafia) return null;

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
