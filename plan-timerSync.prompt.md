# FE Task: Synchronized Game Timers via Server Timestamps

## Problem

Currently every client starts its own countdown independently when it receives a
WebSocket event. If one player has a 2-second lag, their timer starts 2 seconds late —
so they see "13s left" when everyone else sees "11s left". Under heavy lag the drift
can be several seconds, breaking game atmosphere and fairness.

---

## Solution: count down to an absolute server-stamped end time

The BE now injects a server-side Unix timestamp (ms) into a unified `gameFlow.timerStartedAt`
field whenever a timer starts. The FE computes:

```
endTime = timerStartedAt + duration * 1000
remaining = endTime - Date.now()
```

`Date.now()` is always the client's local clock. Since `timerStartedAt` is the server's
clock at the moment the event happened, all clients — regardless of when they received
the WebSocket packet — count down to the **same absolute moment**.

---

## The universal field

| Field | Set when | Paired duration field |
|---|---|---|
| `timerStartedAt: number` | `speaker` changes, `isVote` turns true, or `isExtraSpeech` turns true | Depends on current state (`speakTime`, `candidateSpeakTime`, `votesTime`) |

It works for all states because in this game **only one timer can be active at any given time**.
It resets to `undefined` / `null` when `startDay` or `startNight` is called.

---

## How to use on FE

### 1. Speaker timer (normal speech + candidate defense)

```typescript
// In your speaker timer hook / component:
const { speaker, speakTime, candidateSpeakTime, timerStartedAt, isVote } = gameFlow;

const durationSec = isVote ? candidateSpeakTime : speakTime;

const getRemainingMs = () => {
  if (!timerStartedAt || !speaker) return durationSec * 1000;
  const endTime = timerStartedAt + durationSec * 1000;
  return Math.max(0, endTime - Date.now());
};
```

### 2. Voting timer

```typescript
const { votesTime, timerStartedAt, isVote } = gameFlow;

const getRemainingMs = () => {
  if (!timerStartedAt || !isVote) return votesTime * 1000;
  const endTime = timerStartedAt + votesTime * 1000;
  return Math.max(0, endTime - Date.now());
};
```

### 3. Extra / last speech timer

```typescript
const { candidateSpeakTime, timerStartedAt, isExtraSpeech } = gameFlow;

const getRemainingMs = () => {
  if (!timerStartedAt || !isExtraSpeech) return candidateSpeakTime * 1000;
  const endTime = timerStartedAt + candidateSpeakTime * 1000;
  return Math.max(0, endTime - Date.now());
};
```

---

## Migration: how to refactor existing timers

Find each place where a timer is started with something like:

```typescript
// OLD — starts a fresh countdown from the full duration, varies per client
setRemainingSeconds(gameFlow.speakTime);
```

Replace with the pattern above:

```typescript
// NEW — counts down to a fixed server-stamped end time, identical for all clients
const remainingMs = getRemainingMs();
setRemainingSeconds(Math.ceil(remainingMs / 1000));
```

The `setInterval` or `useEffect` timer itself does not change — only the **initial
value** (and any re-sync on `gameUpdate`) needs to be derived from `getRemainingMs()`
instead of from the raw duration field.

### Re-sync on gameUpdate

If the component is already mounted and receives a new `gameUpdate` (e.g. speaker changed
mid-round), re-compute the remaining time:

```typescript
useEffect(() => {
  setRemainingMs(getRemainingMs());
}, [gameFlow.timerStartedAt]); // Re-sync any active timer
```

---

## Edge cases

| Case | Behaviour |
|---|---|
| `timerStartedAt` is `null` / `undefined` | Fall back to full duration (safe default) |
| Client clock is ahead of server | `remaining` is slightly less → timer ends a bit early (acceptable) |
| Client clock is behind server | `remaining` is slightly more → timer ends a bit late (acceptable) |
| Player reconnects mid-timer | `gameUpdate` arrives with `timerStartedAt` already set; `getRemainingMs()` computes correct remaining time immediately |
| `startDay` / `startNight` called | Field resets to `null`; timers reset cleanly |

