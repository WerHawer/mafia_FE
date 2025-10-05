import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocketContext } from "@/context/SocketProvider.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { GameId, IGameFlow, IGameRoles } from "@/types/game.types.ts";
import { UserId } from "@/types/user.types.ts";

import { queryKeys } from "../apiConstants.ts";
import {
  addRolesToGame,
  addUserToGame,
  createGame,
  fetchActiveGames,
  fetchGame,
  removeUserFromGame,
  restartGame,
  updateGameFlow,
  updateGameGM,
} from "./api.ts";

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games],
    queryFn: fetchActiveGames,
    select: ({ data }) => data,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useFetchActiveGamesWithStore = () => {
  const {
    data: games,
    isLoading,
    refetch,
    ...rest
  } = useFetchActiveGamesQuery();
  const { setGames } = gamesStore;

  if (games) {
    setGames(games);
  }

  return { games, isLoading, refetch, ...rest };
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
  const { socket } = useSocketContext();

  return useMutation({
    mutationFn: (args: { gameId: GameId; userId: UserId }) =>
      addUserToGame(args),
    onSuccess: (data, { gameId, userId }) => {
      queryClient.setQueryData([queryKeys.game, gameId], data);
      socket?.emit(wsEvents.roomConnection, [gameId, userId]);
    },
  });
};

export const useRemoveUserFromGameMutation = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  return useMutation({
    mutationFn: (args: { gameId: GameId; userId: UserId }) =>
      removeUserFromGame(args),
    onSuccess: (data, { gameId, userId }) => {
      queryClient.setQueryData([queryKeys.game, gameId], data);
      socket?.emit(wsEvents.roomLeave, [gameId, userId]);
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
  return useMutation({
    mutationFn: (newFlow: Partial<IGameFlow>) => {
      const { gameFlow, activeGameId } = gamesStore;

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
