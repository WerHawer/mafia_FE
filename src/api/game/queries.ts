import {
  addUserToGame,
  createGame,
  fetchActiveGames,
  fetchGame,
  removeUserFromGame,
} from "./api.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { gamesStore } from "../../store/gamesStore.ts";
import { GameId } from "../../types/game.types.ts";
import { UserId } from "../../types/user.types.ts";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games, "active"],
    queryFn: fetchActiveGames,
    select: ({ data }) => data,
  });
};

export const useGetGamesWithStore = () => {
  const { data, ...rest } = useFetchActiveGamesQuery();
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

export const useRemoveUserFromGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { gameId: GameId; userId: UserId }) =>
      removeUserFromGame(args),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([queryKeys.game, variables.gameId], data);
    },
  });
};
