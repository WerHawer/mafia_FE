// TODO: remove — temporary hook for layout stress-testing with mock players

import { useCallback, useState } from "react";

import { registerOrLoginTestUser } from "@/api/auth/testUsersApi.ts";
import { addUserToGame } from "@/api/game/api.ts";
import { TEST_USER_CREDENTIALS } from "@/config/testUsers.ts";
import { rootStore } from "@/store/rootStore.ts";

export const useAddTestUsers = () => {
  const [isAddingTestUsers, setIsAddingTestUsers] = useState(false);
  const { gamesStore, usersStore } = rootStore;

  const onAddTestUsers = useCallback(async (count: number) => {
    const { activeGameId, activeGamePlayers } = gamesStore;

    if (!activeGameId) return;

    setIsAddingTestUsers(true);

    // Clamp to available credentials
    const credentials = TEST_USER_CREDENTIALS.slice(0, count);

    try {
      for (const credential of credentials) {
        const user = await registerOrLoginTestUser(credential);

        if (!activeGamePlayers.includes(user.id)) {
          // Update the local game store with the BE response so
          // activeGamePlayers is immediately visible to all observers
          const response = await addUserToGame({ gameId: activeGameId, userId: user.id });
          gamesStore.updateGame(response.data);
        }

        usersStore.setUser({ ...user, isOnline: true });
      }

      // Enable mock streams via the shared MobX store so every
      // useMockStreams() instance (VideoGrid, useGridLayout, etc.) reacts
      if (!gamesStore.mockStreamsEnabled) {
        gamesStore.setMockStreamsEnabled(true);
      }
    } catch (error) {
      console.error("[useAddTestUsers] Failed to add test users:", error);
    } finally {
      setIsAddingTestUsers(false);
    }
  }, [gamesStore, usersStore]);

  return { onAddTestUsers, isAddingTestUsers };
};
