import { useParams } from "react-router-dom";
import { useGameQuery } from "../../api/game/queries.ts";
import { useGetUsersWithAddToStore } from "../../api/user/queries.ts";
import { usersStore } from "../../store/usersStore.ts";
import { observer } from "mobx-react-lite";

export const GameInfoSection = observer(() => {
  const { id = "" } = useParams();
  const { data: game } = useGameQuery(id);
  const { isLoading: isUsersLoading } = useGetUsersWithAddToStore(
    game?.players || [],
  );
  const { allUsers } = usersStore;
  console.log("=>(GameInfoSection.tsx:9) game", game);
  console.log("=>(GameInfoSection.tsx:13) allUsers", allUsers);

  return (
    <div>
      <ul style={{ fontSize: "1.2rem" }}>
        {!isUsersLoading && game
          ? game.players.map((id) => <li key={id}>{allUsers[id].name}</li>)
          : null}
      </ul>
    </div>
  );
});
