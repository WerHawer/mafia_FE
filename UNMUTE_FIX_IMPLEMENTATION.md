# 🔧 Виправлення проблеми з Unmute користувачів

## ❌ Проблема:

**LiveKit НЕ ДОЗВОЛЯЄ** серверу виконувати `unmute` для треків користувачів через обмеження безпеки. Сервер може **тільки MUTE** треки.

Для `unmute` операцій потрібно відправляти команду клієнту, і клієнт сам виконує unmute свого треку.

## ✅ Рішення:

### 1. **Додано імпорт rootStore**
```typescript
import { rootStore } from "@/store/rootStore.ts";
```
Потрібно для отримання `myId` поточного користувача.

### 2. **Оновлено обробники WebSocket подій**

#### Було:
```typescript
const handleCameraStatusChanged = (data: {
  userId: string;
  enabled: boolean;
}) => {
  // Тільки оновлення UI
  if (data.userId === participant.identity) {
    setMediaState((prev) => ({
      ...prev,
      isCameraEnabled: data.enabled,
    }));
  }
};
```

#### Стало:
```typescript
const handleCameraStatusChanged = async (data: {
  userId: string;
  participantIdentity: string;
  enabled: boolean;
  targetIdentity?: string;  // ← NEW
}) => {
  console.log("[Media Control] Camera status changed:", data);

  // 1. Update UI state for all participants
  if (data.userId === participant.identity) {
    setMediaState((prev) => ({
      ...prev,
      isCameraEnabled: data.enabled,
    }));
  }

  // 2. Execute local action if command is for current user
  const isForMe =
    data.targetIdentity === myId ||
    data.targetIdentity === participant.identity ||
    (participant.isLocal && data.userId === myId);

  if (isForMe && participant.isLocal) {
    try {
      console.log(
        `[Media Control] Executing local camera ${data.enabled ? "unmute" : "mute"}`
      );
      await participant.setCameraEnabled(data.enabled);  // ← ВИКОНУЄМО КОМАНДУ
    } catch (error) {
      console.error("[Media Control] Error toggling camera:", error);
    }
  }
};
```

### 3. **Аналогічно для мікрофона**
```typescript
const handleMicrophoneStatusChanged = async (data: {
  userId: string;
  participantIdentity: string;
  enabled: boolean;
  targetIdentity?: string;
}) => {
  // Оновлення UI
  if (data.userId === participant.identity) {
    setMediaState((prev) => ({
      ...prev,
      isMicrophoneEnabled: data.enabled,
    }));
  }

  // Виконання команди на клієнті
  const isForMe = /* ... */;
  
  if (isForMe && participant.isLocal) {
    await participant.setMicrophoneEnabled(data.enabled);
  }
};
```

### 4. **Додано детальне логування**
```typescript
console.log("[Media Control] Camera status changed:", data);
console.log(`[Media Control] Executing local camera ${data.enabled ? "unmute" : "mute"}`);
console.log("[Media Control] Sending toggle camera command:", { roomId, userId, enabled });
```

## 🔄 Флоу unmute операції:

### Для MUTE (enabled=false):
```
1. Клієнт → Socket → Сервер: toggleUserMicrophone({ enabled: false })
2. Сервер → LiveKit API: mute track (серверна операція)
3. Сервер → Socket → Всім клієнтам: userMicrophoneStatusChanged({ enabled: false })
4. Клієнт отримує подію → оновлює UI
```

### Для UNMUTE (enabled=true):
```
1. Клієнт → Socket → Сервер: toggleUserMicrophone({ enabled: true })
2. Сервер НЕ викликає LiveKit API (не може unmute)
3. Сервер → Socket → Цільовому клієнту: userMicrophoneStatusChanged({ 
     enabled: true, 
     targetIdentity: "user-id" 
   })
4. Цільовий клієнт отримує подію → виконує participant.setMicrophoneEnabled(true)
5. LiveKit викликає подію trackUnmuted → оновлюється UI у всіх
```

## 📊 Ключові зміни:

| Компонент | Було | Стало |
|-----------|------|-------|
| WebSocket data | `{ userId, enabled }` | `{ userId, participantIdentity, enabled, targetIdentity }` |
| Обробка події | Тільки UI update | UI update + Local action |
| Unmute | Не працював | Працює через клієнта |
| Логування | Мінімальне | Детальне |

## 🎯 Перевірка isForMe:

```typescript
const isForMe =
  data.targetIdentity === myId ||                      // За userId
  data.targetIdentity === participant.identity ||       // За participantIdentity
  (participant.isLocal && data.userId === myId);        // Для локального гравця
```

Це гарантує, що команда виконається тільки у правильного користувача.

## ✅ Тестування:

### Тест 1: Self mute/unmute
```
Користувач клікає свій мікрофон:
→ Socket відправка
→ Сервер обробка
→ Socket подія назад
→ participant.setMicrophoneEnabled()
→ UI update
✅ Має працювати для обох операцій
```

### Тест 2: GM mute гравця
```
GM клікає мікрофон гравця (mute):
→ Socket відправка з requesterId=GM
→ Сервер виконує mute через LiveKit
→ Socket подія до гравця
→ UI update
✅ Має працювати
```

### Тест 3: GM unmute гравця
```
GM клікає мікрофон гравця (unmute):
→ Socket відправка з requesterId=GM
→ Сервер НЕ викликає LiveKit
→ Socket подія до гравця з targetIdentity
→ Гравець виконує participant.setMicrophoneEnabled(true)
→ LiveKit propagates unmute
→ UI update у всіх
✅ Тепер має працювати!
```

### Тест 4: Batch операції
```
GM вимикає всі мікрофони:
→ Batch mute через сервер
→ Всі отримують події
→ UI update у всіх
✅ Має працювати

GM вмикає всі мікрофони:
→ Batch unmute через сервер
→ Кожен клієнт отримує targetIdentity
→ Кожен виконує свій unmute
→ UI update у всіх
✅ Тепер має працювати!
```

## 🐛 Debug логи:

Тепер в консолі побачиш:
```
[Media Control] Sending toggle camera command: { roomId: "...", userId: "...", enabled: true }
[Media Control] Camera status changed: { userId: "...", participantIdentity: "...", enabled: true, targetIdentity: "..." }
[Media Control] Executing local camera unmute
```

Це допоможе швидко знайти проблеми.

## ⚠️ Важливі нюанси:

1. **Не дублюйте дії**: Команда виконується тільки через WebSocket подію, не в toggle функціях
2. **Перевіряйте identity**: Завжди перевіряємо `isForMe` перед виконанням
3. **Обробка помилок**: Відловлюємо помилки від LiveKit
4. **Local тільки**: Команда виконується тільки якщо `participant.isLocal === true`

## 📝 Відповідність документації:

✅ Додано `rootStore` для отримання `myId`
✅ Оновлено типи WebSocket подій
✅ Додано перевірку `targetIdentity`
✅ Додано виконання `participant.setCameraEnabled()` / `participant.setMicrophoneEnabled()`
✅ Додано детальне логування
✅ Не викликаємо participant methods в toggle функціях

---

**Створено**: 2025-01-24  
**Тип**: Bug Fix  
**Статус**: ✅ IMPLEMENTED  
**Документ**: MEDIA_CONTROL_CLIENT_IMPLEMENTATION.md

