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
import { wsEvents } from "../../config/wsEvents.ts";
import { UserId } from "../../types/user.ts";
import { GameId } from "../../types/game.ts";
import { useSocket } from "../../hooks/useSocket.ts";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games, "active"],
    queryFn: fetchActiveGames,
    select: ({ data }) => data,
  });
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
  const { subscribe } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.updateGame, (game) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.game, game.id],
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, subscribe]);

  return useMutation({
    mutationFn: (args: { gameId: GameId; userId: UserId }) =>
      removeUserFromGame(args),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([queryKeys.game, variables.gameId], data);
    },
  });
};
