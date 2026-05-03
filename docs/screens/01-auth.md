# Auth Screens

Screens: Login, Register, Email Verification

---

## Login

**Route:** `/login`

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │        Budget Planner          │                │
│              │     Plan your financial life   │                │
│              │                                │                │
│              │  Email address                 │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │ user@email.com           │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  Password                      │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │ ••••••••••               │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │         Sign in          │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  Forgot password?              │                │
│              │                                │                │
│              │  ─────────── or ───────────    │                │
│              │                                │                │
│              │  New here? Create an account   │                │
│              └────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────────┐
│                          │
│                          │
│   Budget Planner         │
│   Plan your financial    │
│   life                   │
│                          │
│   Email address          │
│   ┌──────────────────┐   │
│   │ user@email.com   │   │
│   └──────────────────┘   │
│                          │
│   Password               │
│   ┌──────────────────┐   │
│   │ ••••••••••       │   │
│   └──────────────────┘   │
│                          │
│   ┌──────────────────┐   │
│   │    Sign in       │   │
│   └──────────────────┘   │
│                          │
│   Forgot password?       │
│                          │
│   ─────── or ────────    │
│                          │
│   New here?              │
│   Create an account      │
│                          │
└──────────────────────────┘
```

### Features

- Email + password sign-in
- Show/hide password toggle
- Inline validation (invalid email format, empty fields)
- "Forgot password?" → sends reset email, shows confirmation message inline
- "Create an account" link → `/register`
- Redirect to `/` after successful login
- If user arrived via invite link, redirect back to invite URL after login

### Proposed Improvements

- OAuth buttons (Google, GitHub) below the divider — prep for Better Auth OAuth providers
- "Remember me" checkbox (30-day session vs default session)

---

## Register

**Route:** `/register`

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │        Budget Planner          │                │
│              │       Create your account      │                │
│              │                                │                │
│              │  Full name                     │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │ Jane Doe                 │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  Email address                 │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │ user@email.com           │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  Password                      │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │ ••••••••••               │  │                │
│              │  └──────────────────────────┘  │                │
│              │  ✓ 8+ chars  ✓ uppercase        │                │
│              │  ✓ number    ○ special char     │                │
│              │                                │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │      Create account      │  │                │
│              │  └──────────────────────────┘  │                │
│              │                                │                │
│              │  Already have an account?      │                │
│              │  Sign in                       │                │
│              └────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features

- Name, email, password fields
- Live password strength indicator (4 criteria checklist shown below field)
- Inline Zod validation (onBlur mode)
- On submit → Better Auth creates user → redirect to `/verify-email`
- "Sign in" link → `/login`

---

## Email Verification

**Route:** `/verify-email`

### Layout (desktop + mobile identical — centered card)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │                                │                │
│              │   [envelope icon]              │                │
│              │                                │                │
│              │   Check your email             │                │
│              │                                │                │
│              │   We sent a verification link  │                │
│              │   to user@email.com            │                │
│              │                                │                │
│              │   ┌──────────────────────────┐ │                │
│              │   │   Resend email           │ │                │
│              │   └──────────────────────────┘ │                │
│              │                                │                │
│              │   Wrong email? Sign in again   │                │
│              │                                │                │
│              └────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features

- Shows email address the link was sent to
- "Resend email" button (disabled for 60s after send, countdown shown)
- Clicking the email link → Better Auth verifies token → redirect to `/`
- "Sign in again" → `/login` (clears current session attempt)
