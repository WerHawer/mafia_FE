import { observer } from "mobx-react-lite";
import { Roles } from "@/types/game.types.ts";
import { rootStore } from "@/store/rootStore.ts";

export const PlayerPanel = observer(() => {
  const { gamesStore, myRole } = rootStore;
  const { gameFlow } = gamesStore;

  return (
    <div>
      {myRole !== Roles.Unknown && <p>Player is {myRole}</p>}
      {gameFlow.isStarted && <p>Game is started</p>}
      {gameFlow.isNight ? <p>Night</p> : <p>Day</p>}
    </div>
  );
});
