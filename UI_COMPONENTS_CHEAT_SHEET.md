# UI Components Quick Reference (Cheat Sheet)

## 🎯 Quick Imports

```tsx
import { IconButton, Dropdown, Menu, MenuItem, MenuSeparator, MenuItemVariant } from "@/UI";
import { ButtonSize, ButtonVariant } from "@/UI/Button/ButtonTypes";
```

---

## 🔘 IconButton

### Basic Usage
```tsx
<IconButton
  icon={<SettingsOutlined />}
  onClick={handleClick}
  ariaLabel="Settings"
/>
```

### With Variants
```tsx
variant={ButtonVariant.Primary}    // Yellow accent
variant={ButtonVariant.Secondary}  // Dark gray (default)
variant={ButtonVariant.Tertiary}   // Transparent
```

### With Sizes
```tsx
size={ButtonSize.Small}   // 3rem x 3rem
size={ButtonSize.Medium}  // 4rem x 4rem (default)
size={ButtonSize.Large}   // 5rem x 5rem
```

### Active State
```tsx
<IconButton active={isOpen} />  // Shows as selected
```

---

## 📋 Menu Components

### Basic Menu
```tsx
<Menu>
  <MenuItem label="Action 1" onClick={handleAction1} />
  <MenuItem label="Action 2" onClick={handleAction2} />
</Menu>
```

### With Icons
```tsx
<MenuItem
  icon={<UserOutlined />}
  label="Profile"
  onClick={handleProfile}
/>
```

### With Variants
```tsx
variant={MenuItemVariant.Default}  // White text (default)
variant={MenuItemVariant.Danger}   // Red text + red hover
variant={MenuItemVariant.Success}  // Green text + green hover
```

### With Separator
```tsx
<Menu>
  <MenuItem label="Edit" onClick={handleEdit} />
  <MenuSeparator />
  <MenuItem label="Delete" onClick={handleDelete} variant={MenuItemVariant.Danger} />
</Menu>
```

---

## 🎪 Dropdown

### Complete Example
```tsx
const [isOpen, setIsOpen] = useState(false);

<Dropdown
  trigger={
    <IconButton
      icon={<MoreOutlined />}
      onClick={() => setIsOpen(!isOpen)}
      active={isOpen}
      ariaLabel="Menu"
    />
  }
  content={
    <Menu>
      <MenuItem label="Action" onClick={handleAction} />
    </Menu>
  }
  isOpen={isOpen}
  onToggle={setIsOpen}
  placement="bottom-end"
/>
```

### Placement Options
```tsx
placement="top"
placement="bottom"
placement="left"
placement="right"
placement="top-start"
placement="top-end"
placement="bottom-start"
placement="bottom-end"  // Most common for menus
```

---

## 🎨 Common Patterns

### User Menu
```tsx
<Dropdown
  trigger={<IconButton icon={<UserOutlined />} />}
  content={
    <Menu>
      <MenuItem icon={<UserOutlined />} label="Profile" onClick={goToProfile} />
      <MenuItem icon={<SettingOutlined />} label="Settings" onClick={goToSettings} />
      <MenuSeparator />
      <MenuItem 
        icon={<LogoutOutlined />} 
        label="Logout" 
        onClick={handleLogout}
        variant={MenuItemVariant.Danger}
      />
    </Menu>
  }
  isOpen={isOpen}
  onToggle={setIsOpen}
/>
```

### Actions Menu
```tsx
<Dropdown
  trigger={<IconButton icon={<MoreOutlined />} />}
  content={
    <Menu>
      <MenuItem icon={<EditOutlined />} label="Edit" onClick={handleEdit} />
      <MenuItem icon={<CopyOutlined />} label="Duplicate" onClick={handleDuplicate} />
      <MenuSeparator />
      <MenuItem 
        icon={<DeleteOutlined />} 
        label="Delete" 
        onClick={handleDelete}
        variant={MenuItemVariant.Danger}
      />
    </Menu>
  }
  isOpen={isOpen}
  onToggle={setIsOpen}
/>
```

### Toolbar Buttons
```tsx
<div style={{ display: "flex", gap: "1rem" }}>
  <IconButton icon={<UndoOutlined />} onClick={undo} ariaLabel="Undo" />
  <IconButton icon={<RedoOutlined />} onClick={redo} ariaLabel="Redo" />
  <IconButton icon={<SaveOutlined />} onClick={save} ariaLabel="Save" />
</div>
```

---

## ⌨️ Accessibility Tips

1. **Always provide `ariaLabel`** for IconButton
2. **Use semantic labels** for MenuItem
3. **Keyboard navigation** works automatically (Tab, Enter, Space)
4. **Close on Escape** is handled by Dropdown
5. **Focus management** is automatic

---

## 🎯 Best Practices

✅ **DO:**
- Use IconButton for single action buttons
- Provide clear aria labels
- Group related items with MenuSeparator
- Use danger variant for destructive actions
- Close menu after action: `setIsOpen(false)`

❌ **DON'T:**
- Don't use more than 7-8 items in a menu
- Don't forget aria-label on IconButton
- Don't leave menu open after action
- Don't use vague labels like "Action"

---

## 🐛 Troubleshooting

**Menu doesn't close on click?**
```tsx
onClick={() => {
  handleAction();
  setIsOpen(false);  // Add this!
}}
```

**IconButton not hoverable?**
```tsx
disabled={false}  // Check disabled prop
```

**Menu appears in wrong position?**
```tsx
placement="bottom-end"  // Try different placement
```

---

## 📚 Full Documentation

See `src/UI/README.md` for detailed documentation.

See `src/components/UIComponentsExample.tsx` for live examples.

