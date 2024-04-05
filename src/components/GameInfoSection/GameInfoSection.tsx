import { useGetUsersWithAddToStore } from "../../api/user/queries.ts";
import { usersStore } from "../../store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { gamesStore } from "../../store/gamesStore.ts";

export const GameInfoSection = observer(() => {
  const { activeGame } = gamesStore;
  const { getUser } = usersStore;

  const usersIds = useMemo(() => {
    if (!activeGame) return [];

    return [
      ...new Set([...activeGame.players, activeGame.gm, activeGame.owner]),
    ];
  }, [activeGame]);

  const { isLoading: isUsersLoading } = useGetUsersWithAddToStore(usersIds);

  const gameMaster = activeGame ? getUser(activeGame.gm)?.name : null;

  return (
    <div>
      <ul style={{ fontSize: "1.2rem" }}>
        {!isUsersLoading && activeGame
          ? activeGame.players.map((id) => <li key={id}>{getUser(id).name}</li>)
          : null}
      </ul>

      {gameMaster && <p>GM: {gameMaster}</p>}
    </div>
  );
});

GameInfoSection.displayName = "GameInfoSection";
