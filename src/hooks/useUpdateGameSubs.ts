import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { wsEvents } from "../config/wsEvents.ts";
import { queryKeys } from "../api/apiConstants.ts";
import { IGame } from "../types/game.ts";
import { AxiosResponse } from "axios";
import { useSocket } from "./useSocket.ts";

export const useUpdateGameSubs = () => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.updateGame, (newGame) => {
      queryClient.setQueryData(
        [queryKeys.game, newGame.id],
        (oldData: AxiosResponse<IGame>) => {
          if (!newGame) return oldData;

          return { ...oldData, data: newGame };
        },
      );

      queryClient.setQueryData(
        [queryKeys.games, "active"],
        (oldData: AxiosResponse<IGame[]>) => {
          const { data } = oldData ?? { data: [] };
          const ids = data.map((game) => game.id);

          if (!ids.includes(newGame.id)) {
            return { ...oldData, data: [...data, newGame] };
          }

          return {
            ...oldData,
            data: data.map((game) => (game.id === newGame.id ? newGame : game)),
          };
        },
      );
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, subscribe]);
};
