# Budget Settings

**Route:** `/budgets/:id/settings`
Two tabs: **Budget** (metadata) and **People** (persons management).

---

## Desktop Layout — Budget Tab

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Settings                                              │
│         │                                                        │
│         │  [  Budget  ]  [  People  ]                           │
│         │  ─────────────────────────────────────────────────    │
│         │                                                        │
│         │  Budget name *                                         │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │ Family 2025                                      │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  Description                                           │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │ Financial plan for our household                 │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  Start date *             End date *                   │
│         │  ┌─────────────────────┐  ┌─────────────────────────┐ │
│         │  │ 01/01/2025          │  │ 01/01/2055              │ │
│         │  └─────────────────────┘  └─────────────────────────┘ │
│         │                                                        │
│         │  Currency *               Initial savings              │
│         │  ┌─────────────────────┐  ┌─────────────────────────┐ │
│         │  │ EUR - Euro       ▾  │  │ 10 000                  │ │
│         │  └─────────────────────┘  └─────────────────────────┘ │
│         │                                                        │
│         │                      [Save changes]                    │
│         │                                                        │
│         │  ─────────────────────────────────────────────────    │
│         │  Danger zone                                           │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │ Delete this budget          [Delete budget]      │ │
│         │  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Desktop Layout — People Tab

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Settings                                              │
│         │                                                        │
│         │  [  Budget  ]  [  People  ]                           │
│         │  ─────────────────────────────────────────────────    │
│         │                                                        │
│         │  People in this budget          [+ Add adult]         │
│         │                                    [+ Add child]      │
│         │                                                        │
│         │  Adults                                                │
│         │  ┌────────┬──────────┬──────┬────────────┬─────────┐  │
│         │  │ Name   │ Sex      │ DOB  │ Age (now)  │         │  │
│         │  ├────────┼──────────┼──────┼────────────┼─────────┤  │
│         │  │ Jane   │ Female   │ 1985 │ 40         │ [✎] [✕] │  │
│         │  │ Marc   │ Male     │ 1983 │ 42         │ [✎] [✕] │  │
│         │  └────────┴──────────┴──────┴────────────┴─────────┘  │
│         │                                                        │
│         │  Children                                              │
│         │  ┌────────┬──────────┬────────────┬──────┬──────────┐ │
│         │  │ Name   │ Sex      │ DOB/Planned│ Age  │          │ │
│         │  ├────────┼──────────┼────────────┼──────┼──────────┤ │
│         │  │ Emma   │ Female   │ 03/2020    │ 5    │ [✎] [✕]  │ │
│         │  │ (baby) │ Unknown  │ 09/2026 ★  │ –    │ [✎] [✕]  │ │
│         │  └────────┴──────────┴────────────┴──────┴──────────┘ │
│         │  ★ planned birth                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout — People Tab

```
┌──────────────────────────┐
│ [≡]  Settings       [👤] │
├──────────────────────────┤
│ [ Budget ] [ People ]    │
├──────────────────────────┤
│ Adults          [+ Add]  │
│ ┌──────────────────────┐ │
│ │ Jane · Female · 40   │ │
│ │            [✎]  [✕]  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Marc · Male · 42     │ │
│ │            [✎]  [✕]  │ │
│ └──────────────────────┘ │
│                          │
│ Children        [+ Add]  │
│ ┌──────────────────────┐ │
│ │ Emma · F · age 5     │ │
│ │            [✎]  [✕]  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ (baby) · planned     │ │
│ │ Sep 2026  [✎]  [✕]   │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Features

### Budget Tab

- React Hook Form + Zod validation
- Currency selector: searchable dropdown (ISO 4217 list, ~30 common currencies shown first)
- Date pickers: MUI `DatePicker` — `end_date` must be after `start_date`
- `Save changes` button disabled until form is dirty
- Changes to `start_date` / `end_date` trigger a confirmation dialog if existing expenses/revenues fall outside the new range
- **Danger zone** (OWNER only): delete budget with confirmation dialog requiring user to type the budget name

### People Tab

#### Add / Edit Adult

Slide-in drawer (right side desktop, bottom sheet mobile):

```
┌──────────────────────────────────────┐
│ Add adult                     [✕]    │
│                                      │
│ Name *                               │
│ ┌──────────────────────────────────┐ │
│ │ Jane                             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Sex                                  │
│ ( ) Male  (●) Female  ( ) Other      │
│                                      │
│ Date of birth *                      │
│ ┌──────────────────────────────────┐ │
│ │ 15/06/1985                       │ │
│ └──────────────────────────────────┘ │
│ Age: 40 years old                    │
│                                      │
│              [Cancel]  [Save]        │
└──────────────────────────────────────┘
```

#### Add / Edit Child

```
┌──────────────────────────────────────┐
│ Add child                     [✕]    │
│                                      │
│ Name (optional)                      │
│ ┌──────────────────────────────────┐ │
│ │ Emma                             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Sex                                  │
│ ( ) Male  ( ) Female  (●) Unknown    │
│                                      │
│ (●) Already born   ( ) Planned       │
│                                      │
│ Date of birth *                      │
│ ┌──────────────────────────────────┐ │
│ │ 12/03/2020                       │ │
│ └──────────────────────────────────┘ │
│                                      │
│              [Cancel]  [Save]        │
└──────────────────────────────────────┘
```

Switching to "Planned" replaces the DOB picker with a "Planned date of birth" picker.

#### Delete person

Confirmation dialog warns if the person is referenced by expenses, revenues, or savings — lists how many items will lose their person link (set to null, not deleted).

---

## Proposed Improvements

- **Retirement age** field per adult — used in Projections screen to mark retirement milestone on charts
- **Life expectancy** field per adult — defines the meaningful end of projections for that person
- **School enrollment auto-suggestion** — when a child is added, offer to pre-fill education expense categories based on planned DOB and school system milestones
