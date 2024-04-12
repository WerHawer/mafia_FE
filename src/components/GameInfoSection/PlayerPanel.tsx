import { gamesStore } from "@/store/gamesStore.ts";
import { getUserRole, Roles } from "@/helpers/getUserRole.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";

export const PlayerPanel = observer(() => {
  const { gameFlow, activeGameRoles } = gamesStore;
  const { myId } = usersStore;

  const role = getUserRole(activeGameRoles, myId);

  return (
    <div>
      {role !== Roles.Unknown && <p>Player is {role}</p>}
      {gameFlow.isStarted && <p>Game is started</p>}
    </div>
  );
});
