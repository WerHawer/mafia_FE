# UI Components

## IconButton

Кнопка з іконкою для компактного відображення дій.

### Props

- `icon` (React.ReactNode) - іконка для відображення
- `onClick` (() => void) - обробник кліку
- `disabled` (boolean) - стан вимкнення
- `variant` (ButtonVariant) - варіант стилю (primary, secondary, tertiary)
- `size` (ButtonSize) - розмір (small, medium, large)
- `active` (boolean) - активний стан
- `className` (string) - додатковий клас
- `ariaLabel` (string) - ARIA лейбл для доступності

### Example

```tsx
<IconButton
  icon={<MoreOutlined />}
  onClick={() => console.log('clicked')}
  variant={ButtonVariant.Secondary}
  size={ButtonSize.Medium}
  ariaLabel="Open menu"
/>
```

---

## Menu, MenuItem, MenuSeparator

Компоненти для створення випадаючих меню.

### Menu

Контейнер для пунктів меню.

### MenuItem Props

- `icon` (React.ReactNode) - іконка пункту меню
- `label` (string) - текст пункту
- `onClick` (() => void) - обробник кліку
- `variant` (MenuItemVariant) - варіант стилю (default, danger, success)
- `disabled` (boolean) - стан вимкнення
- `className` (string) - додатковий клас

### MenuSeparator

Роздільник між пунктами меню.

### Example

```tsx
<Menu>
  <MenuItem
    icon={<CrownOutlined />}
    label="Make me GM"
    onClick={handleClick}
  />
  <MenuSeparator />
  <MenuItem
    icon={<AudioMutedOutlined />}
    label="Mute all"
    onClick={handleMute}
    variant={MenuItemVariant.Danger}
  />
</Menu>
```

---

## Dropdown

Обгортка для Tippy.js, яка відображає контент у випадаючому вікні.

### Props

- `trigger` (React.ReactNode) - елемент, який відкриває dropdown
- `content` (React.ReactNode) - контент dropdown
- `isOpen` (boolean) - стан відкриття
- `onToggle` ((isOpen: boolean) => void) - обробник зміни стану
- `placement` (Placement) - позиція dropdown (за замовчуванням: "bottom-end")
- `className` (string) - додатковий клас

### Example

```tsx
const [isOpen, setIsOpen] = useState(false);

<Dropdown
  trigger={
    <IconButton
      icon={<MoreOutlined />}
      onClick={() => setIsOpen(!isOpen)}
      ariaLabel="Open menu"
    />
  }
  content={
    <Menu>
      <MenuItem label="Action 1" onClick={handleAction} />
    </Menu>
  }
  isOpen={isOpen}
  onToggle={setIsOpen}
  placement="bottom-end"
/>
```

---

## Best Practices

1. **Accessibility** - всі інтерактивні елементи мають `aria-label` та підтримку клавіатури
2. **Keyboard navigation** - використовуйте Tab для навігації, Enter/Space для активації
3. **Composition** - комбінуйте компоненти для створення складних UI
4. **Consistent styling** - всі компоненти використовують theme.scss та mixins.scss

