import { gamesStore } from "../../store/gamesStore.ts";

export const PlayerPanel = () => {
  const { gameFlow } = gamesStore;

  return (
    <div>
      <p>Player Panel</p>
      {gameFlow.isStarted && <p>Game is started</p>}
    </div>
  );
};
