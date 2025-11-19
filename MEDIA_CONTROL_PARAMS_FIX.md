# ✅ Виправлено передачу параметрів на Backend

## 🎯 Що було виправлено

### ❌ Проблема:
Frontend передавав недостатньо параметрів для Backend:
```typescript
// БУЛО:
sendMessage(wsEvents.toggleUserCamera, {
  userId: targetUserId,
  enabled: !currentlyEnabled,
});
```

Backend очікував:
```typescript
{
  roomId: string;
  userId: string;
  participantIdentity: string;
  enabled: boolean;
  requesterId: string;
}
```

---

### ✅ Рішення:

Тепер Frontend передає всі необхідні параметри:
```typescript
// СТАЛО:
sendMessage(wsEvents.toggleUserCamera, {
  roomId,                           // ID кімнати LiveKit
  userId: targetUserId,             // ID користувача в базі даних
  participantIdentity: participant.identity, // Identity учасника в LiveKit
  enabled: !currentlyEnabled,       // Новий стан
  requesterId,                      // ID того, хто робить запит
});
```

---

## 📝 Внесені зміни

### 1. **types/socket.types.ts**

Оновлено типи для `WSSentEventData`:

```typescript
export interface WSSentEventData {
  // ...existing events...
  [wsEvents.toggleUserCamera]: {
    roomId: string;              // ✅ Додано
    userId: UserId;              // ✅ Було
    participantIdentity: string; // ✅ Додано
    enabled: boolean;            // ✅ Було
    requesterId: UserId;         // ✅ Додано
  };
  [wsEvents.toggleUserMicrophone]: {
    roomId: string;              // ✅ Додано
    userId: UserId;              // ✅ Було
    participantIdentity: string; // ✅ Додано
    enabled: boolean;            // ✅ Було
    requesterId: UserId;         // ✅ Додано
  };
}
```

---

### 2. **hooks/useMediaControls.ts**

#### Додано нові параметри в props:
```typescript
type UseMediaControlsProps = {
  participant: Participant;
  isMyStream: boolean;
  isIGM?: boolean;
  roomId: string;      // ✅ Додано
  requesterId: string; // ✅ Додано
};
```

#### Оновлено `toggleCamera`:
```typescript
sendMessage(wsEvents.toggleUserCamera, {
  roomId,                           // ✅ ID кімнати
  userId: targetUserId,             // ID користувача
  participantIdentity: participant.identity, // ✅ LiveKit identity
  enabled: !currentlyEnabled,       // Стан
  requesterId,                      // ✅ ID запитувача
});

console.log("useMediaControls: Toggle camera request sent to server", {
  roomId,                           // ✅ Логується
  userId: targetUserId,
  participantIdentity: participant.identity, // ✅ Логується
  enabled: !currentlyEnabled,
  requesterId,                      // ✅ Логується
  isMyStream,
  isIGM,
  canControl,
});
```

#### Оновлено `toggleMicrophone`:
```typescript
sendMessage(wsEvents.toggleUserMicrophone, {
  roomId,                           // ✅ ID кімнати
  userId: targetUserId,             // ID користувача
  participantIdentity: participant.identity, // ✅ LiveKit identity
  enabled: !currentlyEnabled,       // Стан
  requesterId,                      // ✅ ID запитувача
});

console.log("useMediaControls: Toggle microphone request sent to server", {
  roomId,                           // ✅ Логується
  userId: targetUserId,
  participantIdentity: participant.identity, // ✅ Логується
  enabled: !currentlyEnabled,
  requesterId,                      // ✅ Логується
  isMyStream,
  isIGM,
  canControl,
});
```

#### Оновлено dependency arrays:
```typescript
// toggleCamera
}, [
  socket,
  isMyStream,
  isIGM,
  mediaState.isCameraEnabled,
  participant.identity,
  sendMessage,
  roomId,      // ✅ Додано
  requesterId, // ✅ Додано
]);

// toggleMicrophone
}, [
  socket,
  isMyStream,
  isIGM,
  mediaState.isMicrophoneEnabled,
  participant.identity,
  sendMessage,
  roomId,      // ✅ Додано
  requesterId, // ✅ Додано
]);
```

---

### 3. **components/GameVideo/GameVideo.tsx**

Оновлено виклик `useMediaControls`:

```typescript
const {
  isCameraEnabled,
  isMicrophoneEnabled,
  toggleCamera,
  toggleMicrophone,
  canControl,
  shouldShowControls,
} = useMediaControls({
  participant,
  isMyStream,
  isIGM,
  roomId: gamesStore.activeGameId || "", // ✅ Додано
  requesterId: myId,                      // ✅ Додано
});
```

---

## 📊 Детальний опис параметрів

### 1. **roomId** (string)
- **Джерело:** `gamesStore.activeGameId`
- **Призначення:** ID кімнати в LiveKit
- **Використання на Backend:** Ідентифікація кімнати для LiveKit API
- **Приклад:** `"game-123-abc"`

### 2. **userId** (UserId)
- **Джерело:** `participant.identity`
- **Призначення:** ID користувача в базі даних
- **Використання на Backend:** Ідентифікація користувача для перевірки прав
- **Приклад:** `"user_456"`

### 3. **participantIdentity** (string)
- **Джерело:** `participant.identity`
- **Призначення:** Identity учасника в LiveKit
- **Використання на Backend:** Ідентифікація учасника для LiveKit Server API
- **Приклад:** `"user_456"` (зазвичай співпадає з userId)

### 4. **enabled** (boolean)
- **Джерело:** `!mediaState.isCameraEnabled` або `!mediaState.isMicrophoneEnabled`
- **Призначення:** Бажаний стан медіа (увімкнено/вимкнено)
- **Використання на Backend:** Визначення операції (mute/unmute)
- **Приклад:** `false` (вимкнути), `true` (увімкнути)

### 5. **requesterId** (UserId)
- **Джерело:** `myId` (з `usersStore`)
- **Призначення:** ID користувача, що робить запит
- **Використання на Backend:** Перевірка прав доступу (чи це власник або GM)
- **Приклад:** `"gm_user_789"` (для GM) або `"user_456"` (для власника)

---

## 🔄 Приклад повного потоку даних

### Користувач вимикає свою камеру:

**Frontend відправляє:**
```json
{
  "event": "toggleUserCamera",
  "data": {
    "roomId": "game-123-abc",
    "userId": "user_456",
    "participantIdentity": "user_456",
    "enabled": false,
    "requesterId": "user_456"
  }
}
```

**Backend перевіряє:**
```typescript
if (requesterId !== userId && !isGM) {
  // Access denied
}
// requesterId === userId ✅ Дозволено
```

**Backend виконує:**
```typescript
await livekitClient.mutePublishedTrack(
  roomName: "game-123-abc",
  identity: "user_456",
  trackSource: TrackSource.CAMERA,
  muted: true
);
```

---

### GM вимикає камеру користувача:

**Frontend відправляє:**
```json
{
  "event": "toggleUserCamera",
  "data": {
    "roomId": "game-123-abc",
    "userId": "user_456",
    "participantIdentity": "user_456",
    "enabled": false,
    "requesterId": "gm_user_789"
  }
}
```

**Backend перевіряє:**
```typescript
if (requesterId !== userId && !isGM) {
  // Access denied
}
// isGM === true ✅ Дозволено
```

**Backend виконує:**
```typescript
await livekitClient.mutePublishedTrack(
  roomName: "game-123-abc",
  identity: "user_456",    // Цільовий користувач
  trackSource: TrackSource.CAMERA,
  muted: true
);
```

---

## 🧪 Тестування

### Перевірка в Console:

```javascript
// Після кліку на контрол побачите:
useMediaControls: Toggle camera request sent to server {
  roomId: "game-123-abc",
  userId: "user_456",
  participantIdentity: "user_456",
  enabled: false,
  requesterId: "user_456",  // або "gm_user_789" для GM
  isMyStream: true,          // або false для GM
  isIGM: false,              // або true для GM
  canControl: true
}
```

### Перевірка в Network → WS → Messages:

```json
{
  "event": "toggleUserCamera",
  "data": {
    "roomId": "game-123-abc",
    "userId": "user_456",
    "participantIdentity": "user_456",
    "enabled": false,
    "requesterId": "user_456"
  }
}
```

---

## ✅ Результат

### Frontend ✅ ГОТОВО:
- [x] Додано `roomId` в параметри
- [x] Додано `requesterId` в параметри
- [x] Додано `participantIdentity` в параметри
- [x] Оновлено TypeScript типи
- [x] Оновлено виклик `useMediaControls` в `GameVideo`
- [x] Оновлено логування
- [x] TypeScript компіляція успішна

### Backend очікує:
```typescript
{
  roomId: string;              ✅ Передається
  userId: string;              ✅ Передається
  participantIdentity: string; ✅ Передається
  enabled: boolean;            ✅ Передається
  requesterId: string;         ✅ Передається
}
```

---

## 🎉 Висновок

**Всі параметри тепер передаються коректно!**

✅ Frontend відправляє всі необхідні дані для Backend
✅ TypeScript типізація оновлена
✅ Логування включає всі параметри
✅ Код готовий до роботи з Backend

**Готово до тестування з Backend!** 🚀

