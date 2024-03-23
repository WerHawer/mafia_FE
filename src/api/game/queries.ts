import { createGame, fetchActiveGames } from "./api.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../apiConstants.ts";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games, "active"],
    queryFn: fetchActiveGames,
    select: (data) => data.data,
  });
};

export const useCreateGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.games, "active"] });
    },
  });
};
