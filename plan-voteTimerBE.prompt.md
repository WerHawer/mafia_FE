# BE Task: Move Vote Timer & Auto-randomization Logic to Backend

## Context

This is a real-time multiplayer Mafia game using:
- **REST API** (Axios) for state mutations
- **WebSocket** (Socket.IO) for broadcasting state changes to all connected clients
- **Shared game state** stored in `gameFlow` field of the `IGame` document

---

## Current Architecture (Problem)

### How voting works today

1. **GM starts voting** → PATCH `/games/:id/gameFlow` with `{ isVote: true, proposed: [...userIds], votesTime: N }`
2. **Players vote** → each vote is sent via REST/WS, backend updates `gameFlow.voted`
3. **Vote timer** → **the timer runs entirely on the GM's browser** (`useVoteResult.ts` hook)
4. When timer expires on GM's FE:
   - Wait 800ms grace period for last in-flight votes
   - Find players who haven't voted yet (`notVotedPlayers`)
   - Randomly assign each of them to a candidate from `proposed`
   - PATCH `/games/:id/gameFlow` with `{ isVote: false, voted: <finalVotedMap> }` — single atomic update
5. Backend broadcasts WS `gameUpdate` event to all clients
6. All FE clients react to `gameUpdate` → GM's FE opens `VoteResultModal`

### The core problem

The timer lives on the GM's **browser**. This is fragile:

- **Race condition** (already fixed once, but will always be a risk): if we send `{ isVote: false }` first, the BE broadcasts a WS event instantly, which can reset `proposed`/`voted` on the FE store before the second PATCH `{ voted: newVoted }` reads them.
- **GM tab crash / refresh** → vote timer is lost, game gets stuck
- **Single source of truth violation** → result calculation happens on the client, not the server
- **Multiple GM sessions** (e.g., incognito tab) → timer could fire multiple times

---

## What We Want

Move the following responsibilities from FE (`useVoteResult.ts`) to BE:

### 1. Vote timer ownership
When `isVote` is set to `true` with a `votesTime: N` (seconds), the **server** should start a countdown of `N` seconds.

### 2. Auto-randomization of missing votes
When the timer expires on the server:
- Read current `gameFlow.voted` and `gameFlow.proposed`
- Calculate which eligible voters (= `alivePlayers` minus `gameFlow.prostituteBlock`) haven't voted yet
- For each non-voter, randomly assign them to a candidate from `proposed` (excluding themselves if possible)
- Update `gameFlow.voted` with the randomized entries
- Set `gameFlow.isVote = false`
- Broadcast the updated game state via WS `gameUpdate` to all clients

### 3. Early close when all votes are in
If all eligible voters vote before the timer expires:
- Server SHOULD detect this automatically (since it processes every vote PATCH)
- If `Object.values(voted).flat().length >= eligibleVoters.length` → stop the timer early, set `isVote: false`, broadcast `gameUpdate`

### 4. Single-candidate fast-path
If `proposed.length === 1`:
- Server should immediately set `voted = { [proposed[0]]: eligibleVoters }`, `isVote = false` and broadcast
- No timer needed for this case

---

## Data Contracts

### `IGameFlow` (TypeScript, FE types)

```typescript
interface IGameFlow {
  isVote: boolean;          // voting round is active
  isReVote: boolean;        // re-vote round (draw resolution)
  votesTime: number;        // duration of voting timer in SECONDS
  proposed: UserId[];       // candidates being voted on
  proposedBy: Record<UserId, UserId>; // who nominated whom
  voted: { [candidate: UserId]: UserId[] }; // votes map: candidate → list of voters
  prostituteBlock?: UserId; // this player cannot vote this round
  // ... other fields
}
```

### Eligible voters calculation

```
eligibleVoters = alivePlayers.filter(player => player !== gameFlow.prostituteBlock)
```

Where `alivePlayers = game.players.filter(p => !game.gameFlow.killed.includes(p))`

> ⚠️ The `killed` array is the source of truth for dead players.

### Auto-randomization algorithm (current FE logic, to be ported to BE)

```typescript
const notVotedPlayers = eligibleVoters.filter(
  player => !Object.values(voted).flat().includes(player)
);

notVotedPlayers.forEach(player => {
  // Prefer candidates that are not the voter themselves
  let candidateList = proposed.filter(p => p !== player);
  
  // Fallback: if player is the only candidate, they can vote for themselves
  if (candidateList.length === 0) {
    candidateList = proposed;
  }

  const randomCandidate = candidateList[Math.floor(Math.random() * candidateList.length)];
  voted[randomCandidate] = [...(voted[randomCandidate] ?? []), player];
});
```

---

## New WS Event Required: `voteTimerExpired`

We propose BE emits a dedicated WS event **before** the `gameUpdate` broadcast so that FE can:
1. Know that the result was server-driven (not a manual close by GM)
2. Open `VoteResultModal` on GM's screen

### Event payload

```typescript
// New WS event: 'voteTimerExpired'
{
  gameId: string;
  finalVoted: { [candidateId: string]: string[] }; // final state after randomization
}
```

Alternatively, if adding a new WS event is too much overhead, the FE can detect the transition by observing `gameUpdate`:
- `gameFlow.isVote` changes from `true` → `false`
- `gameFlow.isReVote` is still `false`

**Currently, the FE already reacts to `gameUpdate` and the GM opens the modal manually.** We need to auto-open `VoteResultModal` when the server closes voting — this is why a dedicated event (or a flag like `autoResolved: true` in the `gameUpdate` payload) would help.

---

## FE Changes After BE Migration

Once BE owns the timer and auto-randomization:

### Remove from `useVoteResult.ts`:
- The entire `setInterval` logic that polls `endVoteTime`
- `randomVote` callback
- All `useRef` guards (`hasAutoVotedRef`, `hasAutoVotedForSingleRef`)
- `VOTE_SETTLE_DELAY_MS` constant
- `endVoteTime` useMemo
- `votedRef`, `eligibleVotersRef`, `proposedRef`

### Keep in `useVoteResult.ts`:
- Listen to WS `voteTimerExpired` (or equivalent signal) → open `VoteResultModal`
- Listen to `gameUpdate` → if `isVote` transitions to `false` → open modal
- Single-candidate instant open on FE side (or wait for BE to handle it)
- `useEffect` that closes the modal when `isVote` goes back to `false` (already done via `closeModal`)

### Simplified `useVoteResult.ts` after migration:

```typescript
// All the timer/randomization logic is gone.
// FE only reacts to server-driven state changes.

useEffect(() => {
  if (!enabled) {
    closeModal();
    return;
  }
}, [closeModal, enabled]);

// Listen to dedicated BE event to open result modal
useEffect(() => {
  socket.on(wsEvents.voteTimerExpired, () => {
    if (isIGM) openModal(ModalNames.VoteResultModal);
  });
  return () => socket.off(wsEvents.voteTimerExpired);
}, [socket, isIGM, openModal]);

// Manual path: all votes are in → open immediately (GM only)
useEffect(() => {
  if (!enabled) return;
  if (eligibleVoters.length === votedCount && isIGM) {
    openModal(ModalNames.VoteResultModal);
  }
}, [eligibleVoters.length, enabled, isIGM, openModal, votedCount]);
```

---

## REST API Change Required

### Current: `PATCH /games/:id/gameFlow`
Already exists. Accepts `Partial<IGameFlow>`.

### No new endpoint needed
The BE timer fires internally. The result is just a regular `gameFlow` patch + `gameUpdate` broadcast — same as any other mutation, just triggered by the server's scheduler instead of the GM's HTTP call.

---

## Edge Cases to Handle on BE

| Case | Expected Behavior |
|---|---|
| GM disconnects while timer is running | Timer continues, auto-vote fires normally |
| Player votes after timer fires but before BE processes it | BE should check if `isVote` is still `true` before accepting. If already `false` → reject/ignore the vote |
| Re-vote round (`isReVote: true`) | Same logic applies — `votesTime` starts a new timer, same randomization |
| `votesTime = 0` | No timer, voting closes only when all eligible voters vote manually |
| `proposed` becomes empty (edge case) | BE should handle gracefully — likely a draw with no candidates, skip timer |
| Double-fire prevention | Use a flag or timer ID to ensure `autoVote` fires only once per `isVote: true` activation |

---

## Migration Strategy (Incremental)

To avoid breaking changes:

1. **Phase 1 — BE adds timer support** (BE change only):
   - When `isVote` is set to `true` with `votesTime > 0`, BE starts an internal timer
   - On expiry → randomize + close voting atomically
   - Emit `voteTimerExpired` WS event + `gameUpdate`

2. **Phase 2 — FE removes timer** (FE change after Phase 1 is deployed and verified):
   - Remove `setInterval` from `useVoteResult.ts`
   - Subscribe to `voteTimerExpired` WS event instead
   - Remove all refs and guards that were only needed for the client-side timer

This way the game keeps working during the transition period — both BE and FE timers will run, **but BE fires ~800ms earlier** so FE timer becomes a no-op.

---

## Summary

| Responsibility | Current Owner | After Migration |
|---|---|---|
| Vote countdown timer | FE (GM's browser) | **BE (server)** |
| Auto-randomize missing votes | FE (GM's browser) | **BE (server)** |
| Single-candidate instant close | FE | **BE (server)** |
| Early close when all votes in | FE (interval poll) | **BE (on each vote PATCH)** |
| Open `VoteResultModal` UI | FE (after own timer) | FE (on `voteTimerExpired` WS event) |
| `VoteResultModal` content/calculation | FE | FE (unchanged) |
| Display vote counts, winner, draw | FE | FE (unchanged) |

