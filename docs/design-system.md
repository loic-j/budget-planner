# Design System

**Visual reference:** `./design/` — open `design/index.html` in a browser to see all components live.

---

## MUI Theme Configuration

Wire this in `apps/web/src/theme.ts`. Every screen must use theme tokens — no raw hex values anywhere in component code.

```typescript
import { createTheme } from '@mui/material/styles';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#009688', light: '#4db6ac', dark: '#00796b' },
    success: { main: '#66bb6a' },
    error: { main: '#ef5350' },
    warning: { main: '#ffa726' },
    info: { main: '#42a5f5' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: {
      primary: 'rgba(255,255,255,0.87)',
      secondary: 'rgba(255,255,255,0.6)',
      disabled: 'rgba(255,255,255,0.38)',
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontSize: '28px', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '22px', fontWeight: 600 },
    h4: { fontSize: '18px', fontWeight: 600 },
    h5: { fontSize: '16px', fontWeight: 600 },
    h6: { fontSize: '14px', fontWeight: 600 },
    body1: { fontSize: '16px' },
    body2: { fontSize: '14px' },
    caption: { fontSize: '12px' },
    overline: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' },
  },
  shape: { borderRadius: 4 },
  shadows: [
    'none',
    '0 2px 8px rgba(0,0,0,0.6)', // elevation 1
    '0 4px 16px rgba(0,0,0,0.7)', // elevation 2
    '0 8px 32px rgba(0,0,0,0.8)', // elevation 3 (dialogs, drawers)
    ...Array(21).fill('none'), // fill remaining slots
  ] as any,
});
```

---

## Color Tokens

| Token                        | Value                    | Usage                               |
| ---------------------------- | ------------------------ | ----------------------------------- |
| `palette.primary.main`       | `#009688` (Teal 500)     | Buttons, active states, focus rings |
| `palette.primary.light`      | `#4db6ac`                | Chip text on primary bg             |
| `palette.primary.dark`       | `#00796b`                | Button hover                        |
| `palette.background.default` | `#121212`                | Page background                     |
| `palette.background.paper`   | `#1e1e1e`                | Cards, sidebar, dialogs             |
| `bg-paper-2`\*               | `#2a2a2a`                | Table headers, nested surfaces      |
| `palette.text.primary`       | `rgba(255,255,255,0.87)` | Main text                           |
| `palette.text.secondary`     | `rgba(255,255,255,0.6)`  | Labels, metadata, placeholder       |
| `palette.text.disabled`      | `rgba(255,255,255,0.38)` | Disabled text, empty states         |
| `palette.divider`            | `rgba(255,255,255,0.12)` | Dividers, borders between surfaces  |
| border (resting)             | `rgba(255,255,255,0.23)` | Input borders, card outlines        |
| border (hover/focus)         | `rgba(255,255,255,0.87)` | Input border on hover               |
| `palette.success.main`       | `#66bb6a`                | Positive values, success states     |
| `palette.error.main`         | `#ef5350`                | Negative values, error states       |
| `palette.warning.main`       | `#ffa726`                | Dirty/unsaved row indicators        |
| `palette.info.main`          | `#42a5f5`                | EDITOR role badge, info alerts      |

\* `#2a2a2a` is not a built-in MUI token — use `sx={{ bgcolor: '#2a2a2a' }}` or extend the palette.

### Alpha variants (for backgrounds)

| Use                     | Value                    |
| ----------------------- | ------------------------ |
| Primary hover/active bg | `rgba(0,150,136,0.12)`   |
| Primary focus ring      | `rgba(0,150,136,0.20)`   |
| Error bg (alert, badge) | `rgba(239,83,80,0.12)`   |
| Warning bg              | `rgba(255,167,38,0.12)`  |
| Success bg              | `rgba(102,187,106,0.12)` |
| Info bg                 | `rgba(66,165,245,0.12)`  |
| Generic muted surface   | `rgba(255,255,255,0.08)` |

---

## Typography Scale

| Variant    | Size | Weight | Notes                                 |
| ---------- | ---- | ------ | ------------------------------------- |
| `h1`       | 36px | 600    | Page titles (rarely used in app)      |
| `h2`       | 28px | 600    | Section headings                      |
| `h3`       | 22px | 600    |                                       |
| `h4`       | 18px | 600    | Dialog titles                         |
| `h5`       | 16px | 600    | Card titles                           |
| `h6`       | 14px | 600    | Small card titles, field group labels |
| `body1`    | 16px | 400    | Readable content, descriptions        |
| `body2`    | 14px | 400    | Default UI text, table cells          |
| `caption`  | 12px | 400    | Helper text, metadata, timestamps     |
| `overline` | 11px | 600    | Section labels (UPPERCASE + tracking) |

---

## Border Radius

| Token                | Value | Usage                                        |
| -------------------- | ----- | -------------------------------------------- |
| `shape.borderRadius` | 4px   | Buttons, inputs, chips, small elements       |
| `r-md`               | 8px   | Cards, stat cards, snackbars                 |
| `r-lg`               | 12px  | Dialogs, drawers, sidebar preview, auth card |

In MUI: use `borderRadius: 2` (×4px = 8px) or inline `sx={{ borderRadius: '12px' }}` for lg.

---

## Elevation / Shadows

| Level | Value                        | Usage                       |
| ----- | ---------------------------- | --------------------------- |
| 1     | `0 2px 8px rgba(0,0,0,0.6)`  | Cards, stat cards, buttons  |
| 2     | `0 4px 16px rgba(0,0,0,0.7)` | Sidebar, floating elements  |
| 3     | `0 8px 32px rgba(0,0,0,0.8)` | Dialogs, drawers, auth card |

---

## Component Patterns

### Buttons

| Variant           | Use when                              |
| ----------------- | ------------------------------------- |
| `contained`       | Primary action (Save, Create, Submit) |
| `outlined`        | Secondary action (Save all, Export)   |
| `text`            | Tertiary / cancel                     |
| `error` contained | Destructive (Delete)                  |
| `error` outlined  | Soft destructive (Remove)             |

Sizes: `small` (28px), `medium` (36px, default), `large` (44px).

```tsx
// ✅ Primary CTA
<Button variant="contained">Create budget</Button>

// ✅ Destructive
<Button variant="contained" color="error">Delete</Button>

// ✅ Cancel
<Button variant="text">Cancel</Button>
```

### Inputs

All inputs use MUI `TextField` with `variant="outlined"`. Focus ring is teal. Error state shows red border + helper text.

```tsx
<TextField
  label="Budget name"
  variant="outlined"
  size="small" // 'small' for table toolbar / dense areas
  fullWidth
  error={!!errors.name}
  helperText={errors.name?.message}
/>
```

Password field always shows a strength indicator (4 bars colored: error → warning → primary → success) + checklist (8+ chars, uppercase, number, special char).

### Chips

Height 24px, border-radius 12px, font-size 12px.

| Class     | Usage                                     |
| --------- | ----------------------------------------- |
| `primary` | Active/selected state, category highlight |
| `success` | Active status                             |
| `warning` | Pending, approaching deadline             |
| `error`   | Overdue, over budget                      |
| `default` | Neutral — frequency, category name        |

```tsx
<Chip label="Monthly" size="small" color="primary" variant="filled" />
<Chip label="🏠 Housing" size="small" />
```

### Role Badges

| Role     | Color           |
| -------- | --------------- |
| `OWNER`  | Primary (teal)  |
| `EDITOR` | Info (blue)     |
| `VIEWER` | Default (muted) |

Implement as `<Chip size="small" label="OWNER" color="primary" />` with `sx={{ height: 20, fontSize: 11, fontWeight: 600 }}`.

### Stat Cards (Summary Cards)

- Background: `background.paper`, border: `divider`, border-radius 8px
- Label: 12px / 500 / uppercase / `text.secondary`
- Value: 28px / 600 — use `success.main` for positive, `error.main` for negative
- Sub-label: 13px / `text.secondary`

```tsx
// Net Cash Flow card
<Box
  sx={{
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    p: '20px 24px',
  }}
>
  <Typography variant="overline" color="text.secondary">
    Net Cash Flow
  </Typography>
  <Typography
    sx={{ fontSize: 28, fontWeight: 600, color: value >= 0 ? 'success.main' : 'error.main' }}
  >
    {formatted}
  </Typography>
  <Typography variant="caption" color="text.secondary">
    / month
  </Typography>
</Box>
```

### Data Tables (DataGrid)

- Header: background `#2a2a2a`, font 12px/600/uppercase/`text.secondary`
- Row hover: `rgba(255,255,255,0.03)` — barely visible
- **Dirty row**: left border 3px `warning.main`, first cell padding adjusted to 13px
- Cell text: `body2` (14px), numbers use `tabular-nums`
- Positive numbers: `success.main` + weight 500
- Negative numbers: `error.main` + weight 500

```tsx
// Dirty row indicator via DataGrid `getRowClassName`
getRowClassName={(params) => params.row.__dirty ? 'row-dirty' : ''}
// In sx prop:
'& .row-dirty': { borderLeft: '3px solid', borderLeftColor: 'warning.main' }
```

### Tabs

Active tab: teal bottom border 2px + teal text color. `variant="standard"` with `TabIndicatorProps` colored primary.

### Dialogs / Drawers

- Background: `background.paper`, border-radius 12px, shadow level 3
- Header: 20px 24px padding, bottom `divider` border, title 18px/600
- Body: 24px padding, 16px gap between fields
- Footer: 16px 24px padding, top `divider` border, right-aligned buttons with 8px gap

### Sidebar

- Width: 240px expanded / 64px icon-only
- Background: `background.paper`, right border `divider`
- Active nav item: `primary-a12` bg + teal text + 3px left teal border (padding-left adjusted to 13px)
- Hover: `rgba(255,255,255,0.05)` bg
- Budget name row: 14px/500 with chevron icon, bottom `divider` border
- Footer: user avatar (32px circle, primary bg, initials) + name/sign-out

### Alerts

Use MUI `Alert` with `variant="outlined"` or custom `sx` to match:

- Border: 1px, color = `{semantic}.main` at 30% opacity
- Background: 12% alpha of semantic color
- Text: semantic color for icon + title, `text.primary` for body

### Snackbars

Background `#333`, border-radius 8px, min-width 280px. Action link: primary color, 600 weight.

### Auth Card

Max-width 400px, centered on `background.default` page. Card: `background.paper`, border-radius 12px, shadow level 3, padding 40px 40px 32px.

### Progress Bars

Height 6px, border-radius 3px, track `divider`. Fill color follows semantic: primary for savings goal, info for secondary goals.

---

## Key Rules

1. **Never hardcode colors** — always use theme tokens via `sx` or `styled`
2. **Primary is Teal (#009688)** — not the MUI default blue
3. **Dark mode only** — no light mode support needed
4. **Inter font at 400/500/600** — no other weights
5. **Positive = `success.main` green, negative = `error.main` red** — consistent across all monetary displays
6. **Dirty/unsaved rows** = 3px left `warning.main` border
7. **Active sidebar item** = 3px left `primary.main` border + primary bg tint
8. **Numbers in tables** = `fontVariantNumeric: 'tabular-nums'` for alignment

---

## Reference

Live component examples: `design/index.html`, `design/auth.html`, `design/budget-list.html`, `design/dashboard.html`

Open locally — no server needed, plain HTML files.
