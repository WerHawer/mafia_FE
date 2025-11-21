# 📡 Batch Media Control - Документація

## 🎯 Огляд

Реалізовано систему **масового управління мікрофонами** для GM з підтримкою винятків.

---

## 🏗️ Архітектура

### 1. **Backend Event: batchToggleMicrophones**

**Payload:**
```typescript
{
  roomId: string;              // ID кімнати LiveKit
  enabled: boolean;            // true - увімкнути, false - вимкнути
  targetUserIds: UserId[];     // Користувачі, яких торкається зміна
  excludedUserIds: UserId[];   // Винятки (не торкаються)
  requesterId: UserId;         // Хто робить запит (GM)
}
```

**Приклад:**
```typescript
// Вимкнути звук всім окрім GM
{
  roomId: "game-123",
  enabled: false,
  targetUserIds: ["user1", "user2", "user3"],  // Всі окрім GM
  excludedUserIds: ["gm_user"],                 // GM залишається зі звуком
  requesterId: "gm_user"
}
```

---

## 🪝 Хук: useBatchMediaControls

### Параметри:

```typescript
{
  roomId: string;        // ID активної гри
  requesterId: UserId;   // ID GM
  allUserIds: UserId[];  // Всі користувачі в грі
}
```

### Повертає:

```typescript
{
  // Універсальна функція
  setMicrophonesForAll: (params: SetMicrophonesForAllParams) => void;
  
  // Готові хелпери
  muteAllForNight: (gmUserId: UserId) => void;
  muteAllExceptSpeaker: (speakerId: UserId, gmUserId: UserId) => void;
  unmuteAllForDay: () => void;
  muteAll: () => void;
  unmuteAll: () => void;
}
```

---

## 📚 API Functions

### 1. setMicrophonesForAll (Універсальна)

```typescript
setMicrophonesForAll({
  enabled: boolean,              // true - увімкнути, false - вимкнути
  excludedUserIds: UserId[],    // Винятки
  reason?: 'night' | 'day' | 'speaker' | 'manual'  // Для логування
})
```

**Приклад:**
```typescript
// Вимкнути звук всім окрім спікера і GM
setMicrophonesForAll({
  enabled: false,
  excludedUserIds: ['speaker_123', 'gm_456'],
  reason: 'speaker'
});
```

---

### 2. muteAllForNight

Вимикає звук всім **окрім GM** (автоматично при настанні ночі).

```typescript
muteAllForNight(gmUserId: UserId)
```

**Приклад:**
```typescript
muteAllForNight('gm_user_123');
```

**Використання:**
```typescript
// В обробнику події "startNight"
useEffect(() => {
  if (gameFlow.isNight) {
    muteAllForNight(gmUserId);
  }
}, [gameFlow.isNight, gmUserId]);
```

---

### 3. muteAllExceptSpeaker

Вимикає звук всім **окрім спікера і GM** (для хвилини промови).

```typescript
muteAllExceptSpeaker(speakerId: UserId, gmUserId: UserId)
```

**Приклад:**
```typescript
muteAllExceptSpeaker('speaker_789', 'gm_user_123');
```

**Використання:**
```typescript
// Коли користувач отримує хвилину промови
useEffect(() => {
  if (gameFlow.currentSpeaker) {
    muteAllExceptSpeaker(gameFlow.currentSpeaker, gmUserId);
  }
}, [gameFlow.currentSpeaker, gmUserId]);
```

---

### 4. unmuteAllForDay

Вмикає звук **всім** (автоматично при настанні дня).

```typescript
unmuteAllForDay()
```

**Приклад:**
```typescript
unmuteAllForDay();
```

**Використання:**
```typescript
// В обробнику події "startDay"
useEffect(() => {
  if (gameFlow.isDay) {
    unmuteAllForDay();
  }
}, [gameFlow.isDay]);
```

---

### 5. muteAll / unmuteAll

Ручне управління (через GM меню).

```typescript
muteAll()    // Вимкнути звук ВСІМ (включно з GM)
unmuteAll()  // Увімкнути звук ВСІМ
```

**Використання:**
```typescript
// В кнопках GM меню
<button onClick={muteAll}>Mute All</button>
<button onClick={unmuteAll}>Unmute All</button>
```

---

## 🎮 GMMenu Component

### Розташування:
**Верхній правий кут** екрану (fixed position)

### Вміст:
1. ⚙️ **Make me GM** - Зробити себе GM (для тестування)
2. 🎥 **Enable/Disable Mock Streams** - Перемикання тестових потоків
3. **---** Розділювач
4. 🔇 **Mute All** - Вимкнути звук всім
5. 🔊 **Unmute All** - Увімкнути звук всім

### Видимість:
Показується **тільки для GM** (`rootStore.isIGM`)

---

## 🔄 Потік даних

### Сценарій: GM натискає "Mute All"

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│    GM    │                    │  Server  │                    │ LiveKit  │
│  Client  │                    │          │                    │  Server  │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ Клік "Mute All"               │                               │
     │────────────────────────────>  │                               │
     │ batchToggleMicrophones        │                               │
     │                               │                               │
     │                               │ Перевірка: isGM = true ✅     │
     │                               │                               │
     │                               │ Loop через targetUserIds      │
     │                               │──────────────────────────────>│
     │                               │ mutePublishedTrack(user1)     │
     │                               │──────────────────────────────>│
     │                               │ mutePublishedTrack(user2)     │
     │                               │──────────────────────────────>│
     │                               │ mutePublishedTrack(user3)     │
     │                               │                               │
     │                               │<──────────────────────────────│
     │                               │         ✅ All done           │
     │                               │                               │
     │                               │ Broadcast for each user:      │
     │ userMicrophoneStatusChanged   │ userMicrophoneStatusChanged   │
     │<──────────────────────────────┼───────────────────────────────│
     │ { userId: user1, enabled: false }                             │
     │<──────────────────────────────┼───────────────────────────────│
     │ { userId: user2, enabled: false }                             │
     │<──────────────────────────────┼───────────────────────────────│
     │ { userId: user3, enabled: false }                             │
     │                               │                               │
     │ UI оновлюється для всіх       │                               │
     │                               │                               │
```

---

## 🎯 Ігрові сценарії

### 1. **Настає ніч**

**Автоматично:**
```typescript
useEffect(() => {
  if (gameFlow.phase === 'night' && rootStore.isIGM) {
    const gmUser = usersStore.users.find(u => gamesStore.isUserGM(u.id));
    if (gmUser) {
      muteAllForNight(gmUser.id);
    }
  }
}, [gameFlow.phase]);
```

**Результат:**
- 🔇 Всі гравці без звуку
- 🔊 GM зі звуком
- 👁️ Всі бачать червоні іконки мікрофонів

---

### 2. **Хвилина промови**

**Автоматично:**
```typescript
useEffect(() => {
  if (gameFlow.currentSpeaker && rootStore.isIGM) {
    const gmUser = usersStore.users.find(u => gamesStore.isUserGM(u.id));
    if (gmUser) {
      muteAllExceptSpeaker(gameFlow.currentSpeaker, gmUser.id);
    }
  }
}, [gameFlow.currentSpeaker]);
```

**Результат:**
- 🔇 Всі гравці без звуку
- 🔊 Спікер зі звуком
- 🔊 GM зі звуком
- 👁️ Всі бачать актуальні іконки

---

### 3. **Настає день**

**Автоматично:**
```typescript
useEffect(() => {
  if (gameFlow.phase === 'day' && rootStore.isIGM) {
    unmuteAllForDay();
  }
}, [gameFlow.phase]);
```

**Результат:**
- 🔊 Всі зі звуком
- 👁️ Всі бачать зелені іконки

---

### 4. **Ручне керування GM**

**Через меню:**
- GM відкриває меню (⋮)
- Натискає "Mute All" або "Unmute All"
- Всі отримують оновлення

**Результат:**
- Миттєва зміна для всіх
- Логування в консоль

---

## 🧪 Тестування

### 1. Перевірка GMMenu:

**Кроки:**
1. Зайти як GM
2. **Очікується:** В правому верхньому куті кнопка з іконкою ⋮
3. Клікнути на кнопку
4. **Очікується:** Меню з 5 пунктами

### 2. Перевірка Mute All:

**Кроки:**
1. GM відкриває меню
2. Натискає "Mute All"
3. **Очікується в Console:**
   ```
   useBatchMediaControls: Batch microphone toggle sent {
     roomId: "game-123",
     enabled: false,
     targetUserIds: ["user1", "user2", "user3"],
     excludedUserIds: [],
     requesterId: "gm_user",
     reason: "manual",
     affectedUsersCount: 3
   }
   ```
4. **Очікується в UI:** Всі іконки мікрофонів червоні

### 3. Перевірка Unmute All:

**Кроки:**
1. GM натискає "Unmute All"
2. **Очікується:** Всі іконки зелені

### 4. Перевірка винятків:

**Код:**
```typescript
setMicrophonesForAll({
  enabled: false,
  excludedUserIds: ['gm_user'],
  reason: 'night'
});
```

**Очікується:**
- Всі червоні окрім GM
- GM залишається зеленим

---

## 📋 Backend Implementation Guide

### Обробник події:

```typescript
socket.on('batchToggleMicrophones', async (data: {
  roomId: string;
  enabled: boolean;
  targetUserIds: string[];
  excludedUserIds: string[];
  requesterId: string;
}) => {
  try {
    const { roomId, enabled, targetUserIds, excludedUserIds, requesterId } = data;
    const isGM = socket.data.isGM;
    
    // Перевірка прав
    if (!isGM) {
      socket.emit('error', { message: 'Only GM can use batch controls' });
      return;
    }
    
    // Batch операція
    const promises = targetUserIds.map(async (userId) => {
      if (excludedUserIds.includes(userId)) return; // Пропускаємо винятки
      
      await livekitClient.mutePublishedTrack(
        roomId,
        userId,
        TrackSource.MICROPHONE,
        !enabled
      );
      
      // Broadcast для кожного користувача
      io.to(roomId).emit('userMicrophoneStatusChanged', {
        userId,
        enabled,
      });
    });
    
    await Promise.all(promises);
    
    console.log(`Batch microphone toggle: ${enabled ? 'unmuted' : 'muted'} ${targetUserIds.length} users`);
  } catch (error) {
    console.error('Batch toggle error:', error);
    socket.emit('error', { message: 'Failed to toggle microphones' });
  }
});
```

---

## ✅ Готовність

### Frontend ✅
- [x] Хук `useBatchMediaControls` створено
- [x] GMMenu компонент створено
- [x] Інтеграція в GamePage
- [x] Переклади додано (EN/UA)
- [x] Універсальна функція + хелпери
- [x] TypeScript типізація
- [x] Логування

### Backend 🔧 (Потрібно)
- [ ] Обробник `batchToggleMicrophones`
- [ ] Перевірка прав GM
- [ ] Batch операції з LiveKit
- [ ] Broadcast для кожного користувача

---

## 🚀 Використання в коді

### Приклад автоматичного керування:

```typescript
// В компоненті Game або GameFlow
const { muteAllForNight, muteAllExceptSpeaker, unmuteAllForDay } = 
  useBatchMediaControls({
    roomId: gamesStore.activeGameId || "",
    requesterId: usersStore.myId,
    allUserIds: usersStore.users.map(u => u.id),
  });

// При зміні фази гри
useEffect(() => {
  if (!rootStore.isIGM) return;
  
  const gmUser = usersStore.users.find(u => gamesStore.isUserGM(u.id));
  if (!gmUser) return;
  
  switch (gameFlow.phase) {
    case 'night':
      muteAllForNight(gmUser.id);
      break;
    case 'day':
      unmuteAllForDay();
      break;
    case 'speech':
      if (gameFlow.currentSpeaker) {
        muteAllExceptSpeaker(gameFlow.currentSpeaker, gmUser.id);
      }
      break;
  }
}, [gameFlow.phase, gameFlow.currentSpeaker]);
```

---

**Готово до використання!** 🎉

