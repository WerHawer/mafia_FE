import { Button } from "../../UI/Button";
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { routes } from "../../router/routs.ts";
import { useTranslation } from "react-i18next";
import {
  useCreateGameMutation,
  useGetGamesWithStore,
} from "../../api/game/queries.ts";
import { Loader } from "../../UI/Loader";
import { createGameObj } from "../../helpers/createGameObj.ts";
import { ButtonSize, ButtonVariant } from "../../UI/Button/ButtonTypes.ts";
import { usersStore } from "../../store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { gamesStore } from "../../store/gamesStore.ts";

const LobbyPage = observer(() => {
  const { myId } = usersStore;
  const { games } = gamesStore;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading: isActiveGamesLoading } = useGetGamesWithStore();

  const { mutate: createGame } = useCreateGameMutation();

  const handleCreateGame = useCallback(() => {
    if (!myId) return;

    const game = createGameObj({ owner: myId });

    createGame(game, {
      onSuccess: (data) => {
        navigate(`${routes.game}/${data.data.id}`);
      },
    });
  }, [createGame, navigate, myId]);

  return (
    <div>
      {isActiveGamesLoading ? (
        <Loader />
      ) : (
        <ul
          style={{
            fontSize: "20px",
          }}
        >
          {games.map((game, i) => (
            <li key={game.id}>
              <Link to={`${routes.game}/${game.id}`} key={game.id}>
                game {i + 1} - in game: {game.players.length}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={handleCreateGame}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Large}
        uppercase
      >
        {t("createGame")}
      </Button>
    </div>
  );
});

export default LobbyPage;
