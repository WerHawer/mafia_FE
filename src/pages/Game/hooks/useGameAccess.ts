import { useFetchGameWithStore } from "@/api/game/queries.ts";
import { rootStore } from "@/store/rootStore.ts";
import { Roles } from "@/types/game.types.ts";

export const useGameAccess = (gameId: string) => {
  const { myId } = rootStore.usersStore;
  const { game: fetchedGame, isLoading, isError } = useFetchGameWithStore(gameId);

  const isStarted = fetchedGame?.gameFlow?.isStarted;

  const allRolePlayers: string[] = fetchedGame
    ? [
        ...(fetchedGame.players ?? []),
        ...(fetchedGame.citizens ?? []),
        ...(fetchedGame.mafia ?? []),
        ...(fetchedGame.sheriff ? [fetchedGame.sheriff] : []),
        ...(fetchedGame.doctor ? [fetchedGame.doctor] : []),
        ...(fetchedGame.prostitute ? [fetchedGame.prostitute] : []),
        ...(fetchedGame.don ? [fetchedGame.don] : []),
        ...(fetchedGame.maniac ? [fetchedGame.maniac] : []),
        fetchedGame[Roles.GM],
      ].filter(Boolean)
    : [];

  const isAllowedIn = !myId || !isStarted || allRolePlayers.includes(myId);

  // Game not found on server (404 or network error)
  const isNotFound = !isLoading && isError;

  // Game exists but is no longer active (finished / closed)
  const isInactive = !isLoading && !!fetchedGame && !fetchedGame.isActive;

  return { fetchedGame, isLoading, isAllowedIn, isNotFound, isInactive };
};
