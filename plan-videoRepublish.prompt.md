# FE Task: Auto-recover LiveKit Video on Disconnect Without Page Reload

## Problem

When a player has a brief network issue, their Socket.io connection (TCP) may drop
and reconnect silently. However, their LiveKit WebRTC session (UDP) can silently die
at the same time — or independently, even while Socket.io stays alive.

Result: the player can still see everyone and reacts to game events (Socket.io is
fine), but **no one can see them** (their LiveKit publisher is broken).
After a full page reload everything works — which confirms the local LiveKit state
is the problem, not the server.

---

## Root cause

Socket.io (TCP) and LiveKit (WebRTC/UDP) are **completely independent connections**.
When one drops and recovers, the other is unaware. Three failure scenarios:

| Scenario | Socket.io | LiveKit | Visible symptom |
|---|---|---|---|
| Brief network drop | drops → auto-reconnects | video track muted/ended | Player invisible to others |
| UDP-only block (mobile NAT) | stays alive | can't publish tracks | Player invisible to others |
| Mobile tab minimized | stays alive | OS pauses camera access | Player's video freezes |

---

## BE changes already made

The BE now emits **`videoRepublishRequired`** in two cases:

1. **Socket reconnect detected**: when BE sees a user reconnect within the 30s grace
   period (`socket.emit('videoRepublishRequired', { reason: 'socket_reconnect' })`).
2. **HealthCheck with reported issue**: FE can send `{ videoIssue: true }` in the
   healthCheck payload and BE responds with `videoRepublishRequired`.

---

## What needs to be implemented on FE

### 1. Listen to `videoRepublishRequired` WS event

Find where Socket.io events are handled (e.g. the main socket listener hook or store)
and add:

```typescript
socket.on('videoRepublishRequired', async ({ reason }) => {
  console.log(`[LiveKit] videoRepublishRequired received. Reason: ${reason}`);
  await republishLocalTracks();
});
```

### 2. Implement `republishLocalTracks()`

This function should be placed near your LiveKit Room instance. It checks if local
tracks are healthy and republishes if needed:

```typescript
const republishLocalTracks = async () => {
  if (!room || room.state !== ConnectionState.Connected) {
    console.warn('[LiveKit] Room not connected — skipping republish');
    return;
  }

  const participant = room.localParticipant;

  // Check camera track
  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  if (cameraPub) {
    const track = cameraPub.track;
    if (!track || track.mediaStreamTrack.readyState === 'ended') {
      console.log('[LiveKit] Camera track ended — republishing');
      await participant.setCameraEnabled(false);
      await participant.setCameraEnabled(true);
    } else if (cameraPub.isMuted && !isUserIntentionallyMuted('camera')) {
      console.log('[LiveKit] Camera muted unexpectedly — unmuting');
      await participant.setCameraEnabled(true);
    }
  }

  // Check microphone track
  const micPub = participant.getTrackPublication(Track.Source.Microphone);
  if (micPub) {
    const track = micPub.track;
    if (!track || track.mediaStreamTrack.readyState === 'ended') {
      console.log('[LiveKit] Microphone track ended — republishing');
      await participant.setMicrophoneEnabled(false);
      await participant.setMicrophoneEnabled(true);
    }
  }
};
```

`isUserIntentionallyMuted('camera')` — check your app state to know if the user
themselves clicked "turn off camera." Don't republish if the user deliberately muted.

### 3. Listen to LiveKit Room `Reconnected` event (covers UDP-only drops)

The LiveKit SDK emits `RoomEvent.Reconnected` after it successfully re-establishes
the WebRTC session via ICE restart. Hook into it to re-publish tracks if needed:

```typescript
import { RoomEvent } from 'livekit-client';

room.on(RoomEvent.Reconnected, () => {
  console.log('[LiveKit] Room reconnected — checking tracks');
  republishLocalTracks();
});

room.on(RoomEvent.Reconnecting, () => {
  console.log('[LiveKit] Room reconnecting...');
});

room.on(RoomEvent.Disconnected, (reason) => {
  console.warn('[LiveKit] Room disconnected:', reason);
  // Optionally show a toast UI notification
});
```

### 4. Detect the "MediaStreamTrack ended" case (mobile / tab background)

On mobile browsers (iOS Safari, Android Chrome), when the app is minimized, the OS
can revoke camera access — the `MediaStreamTrack.readyState` becomes `'ended'`.
The track is effectively dead and cannot be unmuted; it must be republished.

```typescript
// After page becomes visible again (visibilitychange event):
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    await republishLocalTracks();
  }
});
```

### 5. Optional: proactive self-check heartbeat

If you want maximum resilience, add a periodic check every 30 seconds while the
user is on the game page:

```typescript
const VIDEO_HEALTH_CHECK_INTERVAL_MS = 30_000;

useEffect(() => {
  const interval = setInterval(async () => {
    const cameraPub = room?.localParticipant?.getTrackPublication(Track.Source.Camera);
    const isTrackDead =
      cameraPub?.track?.mediaStreamTrack?.readyState === 'ended';

    if (isTrackDead) {
      console.log('[LiveKit] Self-heal: dead camera track detected');
      // Also report to BE so it can log the event:
      socket.emit('healthCheck', { gameId, userId, videoIssue: true });
      await republishLocalTracks();
    }
  }, VIDEO_HEALTH_CHECK_INTERVAL_MS);

  return () => clearInterval(interval);
}, [room, gameId, userId]);
```

---

## Trigger summary

| Trigger | What fires it | Action |
|---|---|---|
| `socket.on('videoRepublishRequired')` | BE detects Socket.io reconnect OR FE reports issue | Run `republishLocalTracks()` |
| `room.on(RoomEvent.Reconnected)` | LiveKit ICE restart succeeded | Run `republishLocalTracks()` |
| `document visibilitychange → visible` | User returns from background / minimized tab | Run `republishLocalTracks()` |
| Periodic heartbeat (30s) | Timer | Check `readyState === 'ended'`, republish if dead |

---

## Important: do NOT full-reconnect the Room

**Do not call `room.disconnect()` + `room.connect()` for this.** That detaches all
remote participants' subscriptions and causes everyone in the room to see a brief
blip. Only call `setCameraEnabled(false/true)` or `setMicrophoneEnabled(false/true)` —
these republish just the local track without affecting the existing Room session.

---

## Notes

- `republishLocalTracks` should be debounced (~500ms) to prevent rapid repeated
  calls if multiple triggers fire simultaneously.
- The BE event `videoRepublishRequired` is emitted **only to the specific socket**
  that reconnected — not broadcast to others. No privacy concern.
- LiveKit SDK version ≥ 1.x required for `getTrackPublication` API.

