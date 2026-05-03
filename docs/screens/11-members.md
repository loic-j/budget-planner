# Members

**Route:** `/budgets/:id/members`
Manage who has access to the budget and generate invite links.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Members                                               │
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  Invite people                                   │ │
│         │  │                                                  │ │
│         │  │  Role            Expires        Max uses         │ │
│         │  │  ┌─────────────┐ ┌───────────┐ ┌─────────────┐  │ │
│         │  │  │ Editor    ▾ │ │ Never   ▾ │ │ Unlimited ▾ │  │ │
│         │  │  └─────────────┘ └───────────┘ └─────────────┘  │ │
│         │  │                                                  │ │
│         │  │  ┌──────────────────────────────────────────┐   │ │
│         │  │  │ https://app.com/invite/xK9mP2qRt7        │   │ │
│         │  │  └──────────────────────────────────────────┘   │ │
│         │  │  [Generate link]                    [Copy link]  │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  Members (3)                                           │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  Avatar  Name           Role        Joined       │ │
│         │  │  ──────────────────────────────────────────────  │ │
│         │  │  [JD]  Jane Doe (you)  [OWNER]     Jan 2025      │ │
│         │  │  [MM]  Marc Martin     [EDITOR  ▾] Feb 2025  [✕] │ │
│         │  │  [SL]  Sophie Lee      [VIEWER  ▾] Mar 2025  [✕] │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  Active invite links (1)                               │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  Role     Uses    Expires    Link                │ │
│         │  │  ───────────────────────────────────────────     │ │
│         │  │  Editor   2/∞    Never      xK9mP2…  [Copy][✕]  │ │
│         │  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌──────────────────────────┐
│ [≡]  Members        [👤] │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Invite people        │ │
│ │                      │ │
│ │ Role: [Editor     ▾] │ │
│ │ Exp:  [Never      ▾] │ │
│ │ Uses: [Unlimited  ▾] │ │
│ │                      │ │
│ │ [Generate link]      │ │
│ │ ┌──────────────────┐ │ │
│ │ │ https://app…     │ │ │
│ │ └──────────────────┘ │ │
│ │           [Copy link]│ │
│ └──────────────────────┘ │
│                          │
│ Members (3)              │
│ ┌──────────────────────┐ │
│ │ [JD] Jane Doe (you)  │ │
│ │      OWNER · Jan 25  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ [MM] Marc Martin     │ │
│ │ [EDITOR ▾]  Feb 25   │ │
│ │                  [✕] │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ [SL] Sophie Lee      │ │
│ │ [VIEWER ▾]  Mar 25   │ │
│ │                  [✕] │ │
│ └──────────────────────┘ │
│                          │
│ Active links (1)         │
│ ┌──────────────────────┐ │
│ │ Editor · 2 uses      │ │
│ │ Never expires        │ │
│ │ [Copy link]     [✕]  │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Features

### Invite Link Generator

Visible to OWNER only.

Fields:

- **Role** — EDITOR or VIEWER (OWNER role cannot be granted via invite)
- **Expires** — Never / 24h / 7 days / 30 days / custom date
- **Max uses** — Unlimited / 1 / 5 / 10 / custom number

Flow:

1. Configure role + expiry + max uses
2. Click `Generate link` → API creates `BudgetInvite` record with a secure random token
3. Full URL displayed: `https://app.com/invite/<token>`
4. `Copy link` copies to clipboard, button briefly shows "Copied!"
5. Link appears in Active invite links table below

Regenerate: clicking `Generate link` again with same settings creates a new token (old one remains active until revoked).

### Members Table

Visible to all roles.

| Column | Notes                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| Avatar | Initials fallback if no profile photo                                        |
| Name   | "(you)" suffix for current user                                              |
| Role   | OWNER = non-editable badge; EDITOR/VIEWER = dropdown (OWNER only can change) |
| Joined | Date member joined via invite or was added                                   |
| Remove | `[✕]` button — OWNER only, not shown on own row                              |

**Change role flow:**

- OWNER clicks role dropdown on a member row
- Dropdown: EDITOR / VIEWER
- Selecting a new role shows confirmation: "Change Marc Martin's role to Viewer?" [Cancel] [Confirm]
- API updates `BudgetMember.role`

**Remove member flow:**

- OWNER clicks `[✕]` on a member row
- Confirmation dialog: "Remove Marc Martin from this budget? They will lose access immediately."
- API deletes `BudgetMember` record

**Leave budget:**

- Non-owner members see a `Leave budget` button at the bottom of the members list
- Confirmation: "Leave Family 2025? You will lose access immediately."

### Active Invite Links Table

Visible to OWNER only.

| Column  | Notes                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------- |
| Role    | EDITOR or VIEWER                                                                                    |
| Uses    | `2/5` (used / max) or `2/∞` for unlimited                                                           |
| Expires | Date or "Never"                                                                                     |
| Link    | Truncated token with `Copy` button                                                                  |
| Revoke  | `[✕]` — deletes the `BudgetInvite` record; existing members who joined via this link are unaffected |

---

## Invite Acceptance Flow

When a new user visits `/invite/<token>`:

1. If not logged in → redirect to `/login?redirect=/invite/<token>` → after login, redirected back
2. If not registered → link to `/register?redirect=/invite/<token>`
3. Token validated: checks expiry + max_uses
4. If valid → confirmation screen: "You've been invited to join **Family 2025** as **Editor**. [Accept invitation]"
5. On accept → `BudgetMember` created, `use_count` incremented, redirect to `/budgets/:id`
6. If token expired or max uses reached → error screen: "This invite link is no longer valid. Ask the budget owner for a new one."

---

## Proposed Improvements

- **Invite by email** — send invite directly to an email address; recipient gets an email with the link (requires email service integration)
- **Member activity log** — show last active date per member ("Last edited 2 days ago")
- **Read-only share link** — public URL that renders a read-only projection view without requiring login, useful for sharing with a financial advisor
- **Transfer ownership** — OWNER can transfer the OWNER role to another EDITOR member
