import { Button } from "@/UI/Button";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/router/routs.ts";
import { useTranslation } from "react-i18next";
import {
  useCreateGameMutation,
  useGetGamesWithStore,
} from "@/api/game/queries.ts";
import { Loader } from "@/UI/Loader";
import { createGameObj } from "@/helpers/createGameObj.ts";
import { formatDate } from "@/helpers/formatDate.ts";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { usersStore } from "@/store/usersStore.ts";
import { observer } from "mobx-react-lite";
import { gamesStore } from "@/store/gamesStore.ts";
import styles from "./GamesList.module.scss";
import noAvatar from "@/assets/images/noAvatar.jpg";

const MAX_PLAYERS = 11;

export const GamesList = observer(() => {
  const { myId, users } = usersStore;
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

  const handleJoinGame = useCallback(
    (gameId: string) => {
      navigate(`${routes.game}/${gameId}`);
    },
    [navigate]
  );

  const getOwnerData = (ownerId: string) => {
    const owner = users[ownerId];
    return {
      nickName: owner?.nikName || "Unknown",
      avatar: owner?.avatar || noAvatar,
    };
  };

  return (
    <div className={styles.container}>
      <h2>{t("activeGames")}</h2>

      {isActiveGamesLoading ? (
        <Loader />
      ) : (
        <div className={styles.gamesTable}>
          <div className={styles.tableHeader}>
            <div className={styles.gameInfo}>
              <span className={styles.ownerName}>{t("owner")}</span>
              <span className={styles.playerCount}>{t("players")}</span>
              <span className={styles.createdAt}>{t("created")}</span>
            </div>
          </div>

          {games.map((game) => (
            <div key={game.id} className={styles.gameRow}>
              <div className={styles.gameInfo}>
                <div className={styles.ownerBlock}>
                  <img
                    src={getOwnerData(game.owner).avatar}
                    alt={getOwnerData(game.owner).nickName}
                    className={styles.avatar}
                  />
                  <span className={styles.ownerName}>
                    {getOwnerData(game.owner).nickName}
                  </span>
                </div>
                <span className={styles.playerCount}>
                  {game.players.length}/{MAX_PLAYERS}
                </span>
                <span className={styles.createdAt}>
                  {formatDate(game.creatingTime)}
                </span>
              </div>

              <Button
                onClick={() => handleJoinGame(game.id)}
                variant={ButtonVariant.Outline}
                size={ButtonSize.Small}
                disabled={game.players.length >= MAX_PLAYERS}
                className={styles.joinButton}
              >
                {t("join")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleCreateGame}
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Large}
        uppercase
        className={styles.createButton}
      >
        {t("createGame")}
      </Button>
    </div>
  );
});

GamesList.displayName = "GamesList";
