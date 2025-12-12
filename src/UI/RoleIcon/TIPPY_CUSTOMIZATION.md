# RoleIcon Tippy Customization

## ⚠️ Важливо: Використання theme prop

Tippy не підтримує `className` prop для стилізації tooltip. 
Замість цього використовується `theme="role-tooltip"` і **глобальні стилі в `styles/index.scss`**.

## Що було налаштовано:

### 1. Розмір тексту
- **Було**: стандартний розмір (залежить від браузера)
- **Стало**: `font-size: 2rem` (у 2 рази більший, оскільки root font-size: 10px)
- **Додатково**: `font-weight: 600` для жирнішого тексту

### 2. Фон
- **Градієнтний фон**: від `color-dark-secondary` до `color-dark-primary`
- **Прозорість**: 98% та 95% для легкого ефекту
- **Backdrop blur**: розмиття фону для сучасного вигляду

### 3. Рамка та тіні
- **Border**: тонка рамка з `color-accent-primary` (жовтий) з прозорістю 30%
- **Box-shadow**: 
  - Основна тінь: `0 4px 12px rgba(0, 0, 0, 0.5)`
  - Світіння: `0 0 20px rgba(accent-primary, 0.15)`

### 4. Текстові тіні
- **Text-shadow**: 
  - `1px 1px 2px rgba(0, 0, 0, 0.7)` - тінь для читабельності
  - `0 0 5px rgba(0, 0, 0, 0.5)` - додаткове розмиття

### 5. Анімація та поведінка
- **Animation**: "scale" - плавне збільшення при появі
- **Duration**: 200ms (вхід), 150ms (вихід)
- **Placement**: "top" - над елементом
- **Arrow**: true - стрілка вказує на елемент
- **Arrow color**: відповідає фону tooltip

## Де знаходяться стилі:

**Файл**: `src/styles/index.scss`

```scss
.tippy-box[data-theme~='role-tooltip'] {
  // Всі стилі тут
}
```

## Як далі налаштовувати:

### Змінити розмір тексту (в `styles/index.scss`):
```scss
.tippy-box[data-theme~='role-tooltip'] {
  .tippy-content {
    font-size: 2.5rem; // Збільшити до 2.5x
    font-size: 1.5rem; // Зменшити до 1.5x
  }
}
```

### Змінити фон (в `styles/index.scss`):
```scss
.tippy-box[data-theme~='role-tooltip'] {
  // Solid color замість градієнта
  background: theme.$color-dark-secondary;
  
  // Або інший градієнт
  background: linear-gradient(
    180deg,
    rgba(theme.$color-accent-primary, 0.2),
    rgba(theme.$color-dark-primary, 0.9)
  );
}
```

### Змінити padding (в `styles/index.scss`):
```scss
.tippy-box[data-theme~='role-tooltip'] {
  .tippy-content {
    padding: 12px 20px; // Більше padding
    padding: 4px 8px;   // Менше padding
  }
}
```

### Додати додаткові ефекти:
```scss
:global(.tippy-box) {
  // Додати blur
  backdrop-filter: blur(20px);
  
  // Додати інші тіні
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Змінити анімацію в компоненті:
```tsx
<Tippy 
  animation="shift-away" // shift-away, shift-toward, scale, perspective
  duration={[300, 200]}  // Повільніша анімація
  delay={[100, 0]}       // Затримка перед появою
>
```

## Інші доступні props для Tippy:

- `offset={[0, 10]}` - зміщення від елемента
- `delay={[500, 0]}` - затримка перед показом/приховуванням
- `interactive={true}` - можна взаємодіяти з tooltip
- `hideOnClick={false}` - не приховувати при кліку
- `trigger="mouseenter focus"` - події, що викликають tooltip
- `maxWidth={300}` - максимальна ширина
- `theme="custom"` - використати кастомну тему

## Як це працює:

### 1. В компоненті (RoleIcon.tsx):
```tsx
<Tippy 
  theme="role-tooltip"  // <-- Вказуємо тему
  content={capitalize(role)}
  animation="scale"
  duration={[200, 150]}
  placement="top"
  arrow={true}
>
  <img ... />
</Tippy>
```

### 2. В глобальних стилях (styles/index.scss):
```scss
.tippy-box[data-theme~='role-tooltip'] {  // <-- Стилі для теми
  background: ...;
  // інші стилі
}
```

### 3. Створення власної теми:

У `styles/index.scss`:
```scss
.tippy-box[data-theme~='my-custom-theme'] {
  background: linear-gradient(...);
  // інші стилі
}
```

У компоненті:
```tsx
<Tippy theme="my-custom-theme" content={...}>
  ...
</Tippy>
```

