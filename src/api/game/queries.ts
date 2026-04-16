import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { wsEvents } from "@/config/wsEvents.ts";
import { useSocketContext } from "@/context/SocketProvider.tsx";
import { gamesStore } from "@/store/gamesStore.ts";
import { GameId, IGameFlow, IGameRoles } from "@/types/game.types.ts";

import { queryKeys } from "../apiConstants.ts";
import {
  addRolesToGame,
  addUserToGame,
  addUserToProposed,
  createGame,
  fetchActiveGames,
  fetchGame,
  removeUserFromGame,
  restartGame,
  shootUser,
  startDay,
  startGame,
  startNight,
  updateGameFlow,
  updateGameGM,
  voteForUser,
} from "./api.ts";

const CACHE_INVALIDATION_DELAY_MS = 300;

const invalidateGameQueries = (queryClient: QueryClient, gameId?: GameId, withDelay = false) => {
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKeys.games] });
    if (gameId) {
      queryClient.invalidateQueries({ queryKey: [queryKeys.game, gameId] });
    }
  };

  if (withDelay) {
    setTimeout(invalidate, CACHE_INVALIDATION_DELAY_MS);
  } else {
    invalidate();
  }
};

export const useFetchActiveGamesQuery = () => {
  return useQuery({
    queryKey: [queryKeys.games],
    queryFn: fetchActiveGames,
    select: ({ data }) => data,
  });
};

export const useFetchActiveGamesWithStore = () => {
  const { data: games, dataUpdatedAt, ...rest } = useFetchActiveGamesQuery();
  const { setGames } = gamesStore;

  useEffect(() => {
    if (games) {
      setGames(games);
    }
  }, [games, dataUpdatedAt, setGames]);

  return { games, ...rest };
};

export const useCreateGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: () => invalidateGameQueries(queryClient),
  });
};

export const useGameQuery = (id: GameId) => {
  return useQuery({
    queryKey: [queryKeys.game, id],
    queryFn: () => fetchGame(id),
    select: ({ data }) => data,
  });
};

export const useFetchGameWithStore = (id: GameId) => {
  const { data: game, dataUpdatedAt, ...rest } = useGameQuery(id);
  const { updateGame } = gamesStore;

  useEffect(() => {
    if (game) {
      updateGame(game);
    }
  }, [game, dataUpdatedAt, updateGame]);

  return { game, ...rest };
};

export const useAddUserToGameMutation = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addUserToGame,
    onSuccess: (_, { gameId, userId }) => {
      socket?.emit(wsEvents.roomConnection, [gameId, userId]);
      invalidateGameQueries(queryClient, gameId, true);
    },
  });
};

export const useRemoveUserFromGameMutation = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeUserFromGame,
    onSuccess: (_, { gameId, userId }) => {
      socket?.emit(wsEvents.roomLeave, [gameId, userId]);
      invalidateGameQueries(queryClient, gameId, true);
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
  return useMutation({ mutationFn: updateGameGM });
};

export const useStartGameMutation = () => {
  return useMutation({ mutationFn: startGame });
};

export const useUpdateGameFlowMutation = () => {
  return useMutation({
    mutationFn: (newFlow: Partial<IGameFlow>) => {
      const { gameFlow, activeGameId } = gamesStore;

      return updateGameFlow({
        gameId: activeGameId ?? "",
        flow: { ...gameFlow, ...newFlow },
      });
    },
  });
};

export const useRestartGameMutation = () => {
  return useMutation({ mutationFn: restartGame });
};

export const useStartDayMutation = () => {
  return useMutation({ mutationFn: startDay });
};

export const useStartNightMutation = () => {
  return useMutation({ mutationFn: startNight });
};

export const useAddUserToProposedMutation = () => {
  return useMutation({ mutationFn: addUserToProposed });
};

export const useVoteForUserMutation = () => {
  return useMutation({ mutationFn: voteForUser });
};

export const useShootUserMutation = () => {
  return useMutation({ mutationFn: shootUser });
};
