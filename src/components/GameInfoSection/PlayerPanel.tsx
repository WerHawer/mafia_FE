import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { Roles } from "@/types/game.types.ts";

export const PlayerPanel = observer(() => {
  const { gameFlow, getUserRole } = gamesStore;
  const { myId } = usersStore;

  const role = getUserRole(myId);

  return (
    <div>
      {role !== Roles.Unknown && <p>Player is {role}</p>}
      {gameFlow.isStarted && <p>Game is started</p>}
      {gameFlow.isNight ? <p>Night</p> : <p>Day</p>}
    </div>
  );
});
