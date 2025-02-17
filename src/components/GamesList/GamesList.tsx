import {
  useCreateGameMutation,
  useGetGamesWithStore,
} from "@/api/game/queries.ts";
import noAvatar from "@/assets/images/noAvatar.jpg";
import { createGameObj } from "@/helpers/createGameObj.ts";
import { formatDate } from "@/helpers/formatDate.ts";
import { routes } from "@/router/routs.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Loader } from "@/UI/Loader";
import { Typography } from "@/UI/Typography";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "./GamesList.module.scss";

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
      {isActiveGamesLoading ? (
        <Loader />
      ) : (
        <div className={styles.gamesTable}>
          <div className={styles.tableHeader}>
            <div className={styles.gameInfo}>
              <Typography variant="span" className={styles.ownerName}>
                {t("owner")}
              </Typography>

              <Typography variant="span" className={styles.playerCount}>
                {t("players")}
              </Typography>

              <Typography variant="span" className={styles.createdAt}>
                {t("created")}
              </Typography>
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
                  <Typography variant="span" className={styles.ownerName}>
                    {getOwnerData(game.owner).nickName === "Unknown"
                      ? t("unknown")
                      : getOwnerData(game.owner).nickName}
                  </Typography>
                </div>

                <Typography variant="span" className={styles.playerCount}>
                  {game.players.length}/{MAX_PLAYERS}
                </Typography>

                <Typography variant="span" className={styles.createdAt}>
                  {formatDate(game.creatingTime)}
                </Typography>
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
