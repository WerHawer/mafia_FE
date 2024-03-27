import { createGame, fetchActiveGames } from "./api.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ONE_HOUR, queryKeys } from "../apiConstants.ts";
import { useEffect } from "react";
import { wsEvents } from "../../config/wsEvents.ts";
import { useSocket } from "../../context/SocketProvider.tsx";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games, "active"],
    queryFn: fetchActiveGames,
    select: (data) => data.data,
    staleTime: ONE_HOUR,
  });
};

export const useCreateGameMutation = () => {
  const { subscribe } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.gameCreated, () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.games, "active"],
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, subscribe]);

  return useMutation({
    mutationFn: createGame,
  });
};
