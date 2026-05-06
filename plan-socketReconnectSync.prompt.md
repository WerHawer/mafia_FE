# FE Task: Sync Game State on Socket Reconnect

## Problem

When a player experiences a brief network lag or tab switch, their Socket.io connection
may drop and reconnect. Any `gameUpdate` / `startNight` / `startDay` / `voteTimerExpired`
broadcasts sent during the disconnect window are **lost** — the player's UI is stuck in
a stale state (e.g., still showing "Day" when the game has moved to "Night").

The BE now runs **Socket.io Connection State Recovery** (`maxDisconnectionDuration: 2min`),
which buffers and replays missed events automatically for short disconnects.
However, if the disconnect lasts longer than 2 minutes, or if the browser fully
reloads the page (hard refresh, mobile returning from background), the buffer is gone
and the FE must manually fetch the latest state.

---

## What needs to be implemented on FE

### Rule: On every socket `connect` event — refetch the current game state

The socket `connect` event fires in two scenarios:
1. **First load** — normal, game state is fetched during page mount anyway.
2. **Reconnect after disconnect** — this is the important case.

Socket.io exposes `socket.recovered` (boolean) on the `connect` event to distinguish them:
- `socket.recovered === true` → Connection State Recovery succeeded. Missed events were
  replayed automatically. **No manual refetch needed.**
- `socket.recovered === false` → Recovery failed (disconnect > 2min, hard reload, etc.).
  **Must fetch game state from REST API.**

### Implementation

Find the place in the codebase where the socket `connect` / `reconnect` event is handled
(likely in a socket provider, hook, or store initialization — e.g., `useSocket.ts`,
`socketStore.ts`, `SocketProvider.tsx`, or similar).

Add the following logic:

```typescript
socket.on('connect', async () => {
  // socket.recovered is true only when Socket.io Connection State Recovery
  // successfully replayed all missed events — no manual refetch needed in that case.
  if (socket.recovered) {
    console.log('[Socket] Reconnected with state recovery — no refetch needed');
    return;
  }

  // Recovery failed (disconnect too long, hard reload, etc.) — fetch latest game state.
  const currentGameId = getCurrentGameId(); // read from router/store/context
  if (!currentGameId) return;

  console.log('[Socket] Reconnected without recovery — fetching fresh game state');

  try {
    const freshGame = await api.get(`/games/${currentGameId}`);
    dispatch(setGame(freshGame)); // or however the game state is updated in the store
  } catch (err) {
    console.error('[Socket] Failed to refetch game state after reconnect:', err);
  }
});
```

> **Important:** Do not call `socket.off('connect')` in a cleanup if this handler
> needs to stay alive for the entire session. Use `socket.on('connect', handler)` once
> at the socket initialization level, not inside a component `useEffect` that unmounts.

### Where to get `currentGameId`

Depends on the routing setup:
- From React Router: `useParams()` → `gameId`
- From a global store (Redux/Zustand/MobX): `selectCurrentGameId(state)`
- From a React context: `useGameContext().gameId`

### When NOT to trigger refetch

- When `socket.recovered === true` (Recovery replayed events, already handled).
- When the player is **not** inside a game page (no `currentGameId`).
- When the player is on the lobby/home page (only games list is needed, and
  `gamesUpdate` will arrive on reconnect anyway).

---

## Expected result

| Scenario | Before fix | After fix |
|---|---|---|
| Short lag (< 2min) | May miss `gameUpdate` | Socket.io replays missed events via Recovery |
| Long disconnect / hard reload | Stuck in stale state | FE fetches fresh state via `GET /games/:id` |
| Normal first load | Works | Works (no change, `recovered` is false but `currentGameId` may not be set yet) |

---

## Notes

- The BE already has `connectionStateRecovery` enabled with `maxDisconnectionDuration: 2min`.
- The `socket.recovered` property is available in **socket.io-client >= 4.6.0**.
  Verify the installed version before using it.
- No BE changes are required for this task.

