import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  useAddUserToGameMutation,
  useRemoveUserFromGameMutation,
} from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

export const useGameSession = (gameId: string) => {
  const { myId } = rootStore.usersStore;
  const { removeActiveGame, updateGame } = rootStore.gamesStore;
  const { t } = useTranslation();

  const { mutate: addUserToGame } = useAddUserToGameMutation();
  const { mutate: removeUserFromGame } = useRemoveUserFromGameMutation();

  const [isJoinedToGame, setIsJoinedToGame] = useState(false);

  useEffect(() => {
    if (!myId || !gameId) return;

    addUserToGame(
      { userId: myId, gameId },
      {
        onSuccess: ({ data: game }) => {
          const wasAlreadyGM = rootStore.gamesStore.activeGameGm === myId;

          updateGame(game);
          setIsJoinedToGame(true);

          if (
            !wasAlreadyGM &&
            game.players.length === 1 &&
            game[Roles.GM] === myId
          ) {
            toast(t('gm.youAreNewGMJoinedEmpty'), { icon: '👑', duration: 6000 });
          }
        },
        onError: () => {
          setIsJoinedToGame(false);
        },
      }
    );

    return () => {
      setIsJoinedToGame(false);
      removeActiveGame();
      removeUserFromGame({ userId: myId, gameId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, myId]);

  return { isJoinedToGame };
};
