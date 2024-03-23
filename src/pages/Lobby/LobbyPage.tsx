import { Button } from "../../UI/Button";
import { useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { routes } from "../../router/routs.ts";
import { useTranslation } from "react-i18next";
import {
  useCreateGameMutation,
  useFetchActiveGamesQuery,
} from "../../api/game/queries.ts";
import { Loader } from "../../UI/Loader";
import { UserContext } from "../../context/SocketProvider.tsx";
import { createGameObj } from "../../helpers/createGameObj.ts";
import { ButtonSize, ButtonVariant } from "../../UI/Button/ButtonTypes.ts";

export const LobbyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: activeGames, isLoading: isActiveGamesLoading } =
    useFetchActiveGamesQuery();
  const user = useContext(UserContext);

  const { mutate: createGame } = useCreateGameMutation();

  const handleCreateGame = useCallback(() => {
    const userId = user?.id;

    if (!userId) return;

    const game = createGameObj({ owner: userId });

    createGame(game, {
      onSuccess: (data) => {
        navigate(`${routes.game}/${data.data.id}`);
      },
    });
  }, [createGame, navigate, user?.id]);

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
          {activeGames?.map((game, i) => (
            <li>
              <Link to={`${routes.game}/${game.id}`} key={game.id}>
                game {i + 1}
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
};
