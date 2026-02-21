# Mobile & Desktop Input Compatibility

## Core Principle
All UI components MUST work on both **mobile (touch)** and **desktop (mouse/keyboard)**. Always test on mobile before deploying.

---

## DateInput Component (`src/components/ui/DateInput.tsx`)

### Pattern: Transparent Native Overlay
```
┌─────────────────────────────┐
│  Display div (dd/mm/yyyy)   │  ← Visual layer (not interactive)
│  ┌───────────────────────┐  │
│  │  <input type="date">  │  │  ← Native input, opacity:0, ON TOP
│  │  pointer-events: auto │  │     Receives ALL touch/click events
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Rules
- **NEVER** use `pointer-events: none` on native inputs — kills mobile touch
- **NEVER** rely on `showPicker()` — not supported on all mobile browsers
- Native `<input type="date">` must be `opacity: 0` + `position: absolute` + `cursor: pointer`
- Let the browser handle opening the native date picker on all devices
- Display div shows formatted value (dd/mm/yyyy), native input stores ISO (yyyy-mm-dd)

### onBlur Validation Pattern
Since the native input is transparent, traditional `onBlur` may not fire reliably.
Instead, trigger validation from `handleChange`:
```tsx
const handleChange = (e) => {
    const newValue = convertToDisplay(e.target.value);
    onChange(newValue);
    // Pass new value directly to avoid stale closure
    if (onBlur) setTimeout(() => onBlur(newValue), 0);
};
```
- `onBlur` signature: `(newValue: string) => void` — receives the NEW value
- Validation functions must use the parameter, NOT read from state (stale closure)

---

## General Mobile Input Rules

### Touch Targets
- Minimum touch target: **44×44px** (Apple HIG) / **48×48dp** (Material)
- Checkboxes, radio buttons, small icons: wrap in a larger clickable `<label>`

### Select / Dropdown
- Native `<select>` works well on mobile — prefer it over custom dropdowns for simple choices
- Custom dropdowns (SearchableSelect): ensure they have proper touch targets and scroll behavior

### Number Inputs
- Use `inputMode="decimal"` or `inputMode="numeric"` for appropriate mobile keyboard
- Block invalid keys like `e`, `E`, `+` via `onKeyDown`

### Text Inputs
- Don't auto-focus on mobile (avoids unexpected keyboard popup)
- Use appropriate `inputMode` for the data type

---

## Testing Checklist (Before Deploy)
- [ ] Date picker opens on mobile tap
- [ ] All form inputs are reachable and tappable
- [ ] Keyboard doesn't obscure active input
- [ ] Validation toasts are visible on mobile screen
