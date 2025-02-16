import { uniq } from "lodash/fp";
import {
  addRolesToGame,
  addUserToGame,
  createGame,
  fetchActiveGames,
  fetchGame,
  restartGame,
  updateGameFlow,
  updateGameGM,
} from "./api.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { gamesStore } from "@/store/gamesStore.ts";
import { GameId, IGameFlow, IGameRoles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";
import { useGetUsersWithAddToStore } from "../user/queries.ts";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games, "active"],
    queryFn: fetchActiveGames,
    select: ({ data }) => data,
  });
};

export const useGetGamesWithStore = () => {
  const { data, ...rest } = useFetchActiveGamesQuery();
  const allGamePlayers = uniq(data?.flatMap((game) => game.players) ?? []);
  const allGameOwners = uniq(data?.map((game) => game.owner) ?? []);
  const allPlayersIds = uniq([...allGamePlayers, ...allGameOwners]);

  useGetUsersWithAddToStore(allPlayersIds, !!allPlayersIds.length);

  const { setGames } = gamesStore;

  useEffect(() => {
    if (!data) return;

    setGames(data);
  }, [data, setGames]);

  return { data, ...rest };
};

export const useCreateGameMutation = () => {
  return useMutation({
    mutationFn: createGame,
  });
};

export const useGameQuery = (id: GameId) => {
  return useQuery({
    queryKey: [queryKeys.game, id],
    queryFn: () => fetchGame(id),
    select: ({ data }) => data,
  });
};

export const useAddUserToGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { gameId: GameId; userId: UserId }) =>
      addUserToGame(args),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([queryKeys.game, variables.gameId], data);
    },
  });
};

export const useAddRolesToGameMutation = () => {
  return useMutation({
    mutationFn: ({
      gameId,
      roles,
    }: {
      gameId: GameId;
      roles: Partial<IGameRoles>;
    }) => addRolesToGame(gameId, roles),
  });
};

export const useUpdateGameGMMutation = () => {
  return useMutation({
    mutationFn: ({ gameId, userId }: { gameId: GameId; userId: UserId }) => {
      return updateGameGM({ gameId, userId });
    },
  });
};

export const useUpdateGameFlowMutation = () => {
  const {
    updateGameFlow: updateLocalGameFlow,
    gameFlow,
    activeGameId,
  } = gamesStore;

  return useMutation({
    mutationFn: (newFlow: Partial<IGameFlow>) => {
      updateLocalGameFlow(newFlow);

      return updateGameFlow({
        gameId: activeGameId,
        flow: { ...gameFlow, ...newFlow },
      });
    },
  });
};

export const useRestartGameMutation = () => {
  return useMutation({
    mutationFn: (gameId: GameId) => {
      return restartGame(gameId);
    },
  });
};
