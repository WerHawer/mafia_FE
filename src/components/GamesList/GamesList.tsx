import { LockOutlined } from "@ant-design/icons";
import { uniq } from "lodash/fp";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useGetUsersWithAddToStore } from "@/api/user/queries.ts";
import noAvatar from "@/assets/images/noAvatar.jpg";
import { ModalNames } from "@/components/Modals/Modal.types.ts";
import { formatDate } from "@/helpers/formatDate.ts";
import { routes } from "@/router/routs.ts";
import { gamesStore } from "@/store/gamesStore.ts";
import { modalStore } from "@/store/modalStore.ts";
import { usersStore } from "@/store/usersStore.ts";
import { Button } from "@/UI/Button";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes.ts";
import { Loader } from "@/UI/Loader";
import { Typography } from "@/UI/Typography";

import styles from "./GamesList.module.scss";

const DEFAULT_MAX_PLAYERS = 11;

export const GamesList = observer(() => {
  const { users } = usersStore;
  const { games } = gamesStore;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openModal } = modalStore;

  const allGameOwners = uniq(games?.map(({ owner }) => owner) ?? []);

  useGetUsersWithAddToStore(allGameOwners, !!allGameOwners.length);

  const handleJoinGame = useCallback(
    (gameId: string, isPrivate: boolean) => {
      if (isPrivate) {
        openModal(ModalNames.EnterPasswordModal, {
          gameId,
          onSuccess: () => {
            navigate(`${routes.game}/${gameId}`);
          },
        });
      } else {
        navigate(`${routes.game}/${gameId}`);
      }
    },
    [navigate, openModal]
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
      {!games ? (
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

          <div className={styles.tableContent}>
            {games?.map((game) => {
              const maxPlayers = game.maxPlayers || DEFAULT_MAX_PLAYERS;
              const isFull = game.playersCount >= maxPlayers;

              return (
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
                      {game.isPrivate && (
                        <LockOutlined className={styles.lockIcon} />
                      )}
                    </div>

                    <Typography variant="span" className={styles.playerCount}>
                      {game.playersCount}/{maxPlayers}
                    </Typography>

                    <Typography variant="span" className={styles.createdAt}>
                      {formatDate(game.creatingTime)}
                    </Typography>
                  </div>

                  {!isFull && (
                    <Button
                      onClick={() => handleJoinGame(game.id, game.isPrivate)}
                      variant={ButtonVariant.Outline}
                      size={ButtonSize.Small}
                      className={styles.joinButton}
                    >
                      {t("join")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

GamesList.displayName = "GamesList";
