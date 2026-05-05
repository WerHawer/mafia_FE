# Plan: Add "Test Users" Item to GMMenu

## Goal

Add a temporary "Test Users" menu item to the GM Menu that generates 12 test player accounts, registers them in the backend game, injects their data into the local store, and enables mock video containers — so the developer can observe layout behaviour with a maximum number of player containers without needing real users or real camera streams.

---

## Steps

### 1. Create `src/config/testUsers.ts`

Define 12 pre-set test user credentials as a typed constant array.

```ts
export type TestUserCredential = {
  login: string;
  password: string;
  nikName: string;
};

export const TEST_USER_CREDENTIALS: TestUserCredential[] = [
  { login: "testplayer01", password: "TestPass123", nikName: "Test Player 01" },
  { login: "testplayer02", password: "TestPass123", nikName: "Test Player 02" },
  // ... up to testplayer12
];
```

---

### 2. Create `src/api/auth/testUsersApi.ts`

Create a helper that attempts `userSignUp` for a test user. If the request fails (user already exists — typically 409 or 400), it falls back to `userLogin`. Returns the `IUser` object from the response in both cases.

```ts
export const registerOrLoginTestUser = async (
  credential: TestUserCredential
): Promise<IUser> => {
  try {
    const res = await userSignUp({ login: credential.login, password: credential.password });
    return res.data.user;
  } catch {
    const res = await userLogin({ login: credential.login, password: credential.password });
    return res.data.user;
  }
};
```

> **Note:** Neither token from these requests is stored. We only need the `IUser.id` to call `addUserToGame` and to populate `usersStore`.

---

### 3. Modify `src/hooks/useMockStreams.ts`

Remove the hard `myTrack` guard that prevents mock containers from rendering when the local camera is off.

**Current behaviour:** 
```ts
if (!mockStreamsEnabled || !myTrack || !activeGamePlayers.length) return [];
```

**Target behaviour:**
```ts
if (!mockStreamsEnabled || !activeGamePlayers.length) return [];
```

Each mock entry is created with `publication: null` (so `trackRef.publication?.track` resolves to `undefined`). `GameVideo` already accepts `track?: Track` (optional), and `PlayerVideo` renders an avatar/name placeholder when no track is present — exactly what we need for layout testing.

---

### 4. Create `src/hooks/useAddTestUsers.ts`

A hook that orchestrates the full flow:

1. Iterate over all 12 `TEST_USER_CREDENTIALS`.
2. Call `registerOrLoginTestUser` for each → get `IUser`.
3. Skip users already present in `activeGamePlayers` (idempotency guard).
4. Call `addUserToGame({ gameId: activeGameId, userId: user.id })` for each new user.
5. Call `usersStore.setUser(user)` so their name/avatar show in the container.
6. After all users are added, call `handleToggleMockStreams()` from `useMockStreams` to enable the visual containers (only if mock streams are not yet enabled).

Exposes:
- `onAddTestUsers: () => Promise<void>` — the action handler
- `isAddingTestUsers: boolean` — loading state for the menu item

```ts
export const useAddTestUsers = () => {
  const [isAddingTestUsers, setIsAddingTestUsers] = useState(false);
  const { gamesStore, usersStore } = rootStore;
  const { activeGameId, activeGamePlayers } = gamesStore;
  const { mockStreamsEnabled, handleToggleMockStreams } = useMockStreams();

  const onAddTestUsers = useCallback(async () => {
    if (!activeGameId) return;
    setIsAddingTestUsers(true);

    try {
      for (const credential of TEST_USER_CREDENTIALS) {
        const user = await registerOrLoginTestUser(credential);

        if (!activeGamePlayers.includes(user.id)) {
          await addUserToGame({ gameId: activeGameId, userId: user.id });
        }

        usersStore.setUser({ ...user, isOnline: true });
      }

      if (!mockStreamsEnabled) {
        handleToggleMockStreams();
      }
    } catch (error) {
      console.error("[useAddTestUsers] Failed to add test users:", error);
    } finally {
      setIsAddingTestUsers(false);
    }
  }, [activeGameId, activeGamePlayers, usersStore, mockStreamsEnabled, handleToggleMockStreams]);

  return { onAddTestUsers, isAddingTestUsers };
};
```

---

### 5. Update `src/hooks/useGMMenu.ts`

- Import `useAddTestUsers`.
- Call it inside `useGMMenu`.
- Add `onAddTestUsers` and `isAddingTestUsers` to the return object.

---

### 6. Update `src/components/GMMenu/GMMenu.tsx`

Destructure `onAddTestUsers` and `isAddingTestUsers` from `useGMMenu()`.

Add this `MenuItem` inside the `{isIGM && (...)}` block, just before the `<MenuSeparator />` that precedes "Leave Game":

```tsx
{/* TODO: remove — temporary layout stress test */}
<MenuItem
  icon={<ExperimentOutlined />}
  label={isAddingTestUsers ? t("gmMenu.addTestUsersLoading") : t("gmMenu.addTestUsers")}
  onClick={onAddTestUsers}
/>
<MenuSeparator />
```

Also add `ExperimentOutlined` to the icon import list at the top.

---

### 7. Update translation files

**`public/locales/en/translation.json`** — inside `"gmMenu"`:
```json
"addTestUsers": "Add Test Users",
"addTestUsersLoading": "Adding test users…"
```

**`public/locales/ua/translation.json`** — inside `"gmMenu"`:
```json
"addTestUsers": "Тестові користувачі",
"addTestUsersLoading": "Додаємо тестових гравців…"
```

---

## Architecture Notes

- The test users are **real backend accounts** — they live in the DB, can receive roles via `addRolesToGame`, and can be set as speaker via `updateGameFlow`. All existing GM actions work against them normally.
- **Mock video containers** are rendered via the modified `useMockStreams` — containers show avatar + name placeholder without any real camera stream.
- The feature is **idempotent**: clicking "Test Users" a second time skips users already in `activeGamePlayers` and won't re-enable mock streams if already active.
- The feature is marked with `// TODO: remove` comments so it is easy to find and delete.
- No new API endpoints are needed — it reuses `/signUp`, `/login`, and `/games/:id/addUser/:userId`.

## Further Considerations

1. **BE user-existence validation**: If `addUserToGame` validates that the userId belongs to a real DB record, the sign-up/login flow is required (covered). If it does NOT validate, we could skip the auth flow and use local fake UUIDs to simplify the implementation.
2. **Parallel vs serial requests**: The loop above runs requests serially to avoid race conditions or rate-limiting. If the BE can handle it, all 12 sign-up/add calls could be parallelised with `Promise.allSettled`.
3. **Mock streams without camera**: After the `useMockStreams` change, test player containers show avatar/name placeholders only. If the developer also needs to see the camera-cloning behaviour (all containers mirror the local stream), the `myTrack` usage can be kept and made optional.
4. **Cleanup**: There is no "remove test users" action planned. To clean them up: restart or finish the game, or manually remove from the BE.

