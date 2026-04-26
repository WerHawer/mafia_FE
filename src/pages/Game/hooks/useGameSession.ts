import { useEffect, useState } from "react";
import {
  useAddUserToGameMutation,
  useRemoveUserFromGameMutation,
} from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";

export const useGameSession = (gameId: string) => {
  const { myId } = rootStore.usersStore;
  const { removeActiveGame, updateGame } = rootStore.gamesStore;

  const { mutate: addUserToGame } = useAddUserToGameMutation();
  const { mutate: removeUserFromGame } = useRemoveUserFromGameMutation();

  const [isJoinedToGame, setIsJoinedToGame] = useState(false);

  useEffect(() => {
    if (!myId || !gameId) return;

    addUserToGame(
      { userId: myId, gameId },
      {
        onSuccess: ({ data: game }) => {
          updateGame(game);
          setIsJoinedToGame(true);
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
