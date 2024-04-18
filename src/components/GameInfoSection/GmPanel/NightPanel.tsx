import styles from "./GmPanel.module.scss";
import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { Roles } from "@/helpers/getUserRole.ts";
import { ChangeEvent, useCallback, useState } from "react";
import { useSocket } from "@/hooks/useSocket.ts";
import { wsEvents } from "@/config/wsEvents.ts";

export const NightPanel = observer(() => {
  const { activeGameRoles, activeGameId, activeGameGm } = gamesStore;
  const { sendMessage } = useSocket();
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);

  const existingActiveRoles = activeGameRoles
    ? Object.entries(activeGameRoles)
        .filter(([key, value]) => Boolean(value) && key !== Roles.Citizens)
        .map(([key]) => key)
    : [];

  const handleRoleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedRole = e.target.value as Exclude<
        Roles,
        Roles.Don | Roles.Unknown
      >;

      const roleIds = activeGameRoles![selectedRole] ?? "";
      console.log("=>(NightPanel.tsx:28) roleIds", roleIds);

      setSelectedRole(selectedRole);
      sendMessage(wsEvents.wakeUp, {
        gameId: activeGameId,
        users: roleIds,
        gm: activeGameGm,
      });
    },
    [activeGameGm, activeGameId, activeGameRoles, sendMessage],
  );

  return (
    <div className={styles.nightContainer}>
      {existingActiveRoles.map((role) => (
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
      ))}
    </div>
  );
});

NightPanel.displayName = "NightPanel";
