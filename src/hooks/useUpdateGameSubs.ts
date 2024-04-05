import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { wsEvents } from "../config/wsEvents.ts";
import { useSocket } from "./useSocket.ts";
import { gamesStore } from "../store/gamesStore.ts";

export const useUpdateGameSubs = () => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();
  const { updateGames } = gamesStore;

  useEffect(() => {
    const unsubscribe = subscribe(wsEvents.updateGame, (newGame) => {
      updateGames(newGame);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, subscribe, updateGames]);
};
