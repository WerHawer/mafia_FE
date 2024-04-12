import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import { useRestartGameMutation } from "@/api/game/queries.ts";

export const GamePanel = observer(() => {
  const { activeGameId, gameFlow } = gamesStore;
  const { mutate: restartGame } = useRestartGameMutation();

  return (
    <div>
      {gameFlow.isNight ? <p>Night</p> : <p>Day</p>}
      <p onClick={() => restartGame(activeGameId)}>Game Started</p>
    </div>
  );
});
