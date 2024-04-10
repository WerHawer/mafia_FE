import { gamesStore } from "../../store/gamesStore.ts";

export const PlayerPanel = () => {
  const { gameFlow } = gamesStore;
  console.log("=>(PlayerPanel.tsx:5) gameFlow", gameFlow);

  return (
    <div>
      <p>Player Panel</p>
      {gameFlow.isStarted && <p>Game is started</p>}
    </div>
  );
};
