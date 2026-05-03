# Projections

**Route:** `/budgets/:id/projections`
Full analytical view — all charts, person age timeline, and data tables in one place.

---

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │  Projections                                           │
│         │                                                        │
│         │  Filters: [Person ▾]  [Category ▾]  [Jan 2025–2055 ▾]│
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  NET WORTH OVER TIME              (@nivo/line)   │ │
│         │  │                                                  │ │
│         │  │  €1M  ─┤                              ╭──────   │ │
│         │  │  €800k─┤                         ╭────╯         │ │
│         │  │  €600k─┤                    ╭────╯              │ │
│         │  │  €400k─┤               ╭────╯                   │ │
│         │  │  €200k─┤    debt ──────╯ assets                 │ │
│         │  │      0─┼─────────────────────────────────────── │ │
│         │  │        2025  2030  2035  2040  2045  2050  2055  │ │
│         │  │  ── Net Worth  ── Assets  ── Savings  ── Debt   │ │
│         │  └──────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  ┌─────────────────────────┐ ┌───────────────────────┐│
│         │  │ MONTHLY CASH FLOW       │ │ CUMULATIVE SAVINGS    ││
│         │  │ (@nivo/bar)             │ │ (@nivo/line)          ││
│         │  │                         │ │                       ││
│         │  │ ▓▓▓░░ ▓▓▓░░ ▓▓▓░░ ▓▓▓░ │ │       ╭───────────    ││
│         │  │ 2025  2030  2035  2040  │ │  ─────╯               ││
│         │  │ ▓ Revenue  ░ Expenses   │ │                       ││
│         │  └─────────────────────────┘ └───────────────────────┘│
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  PERSON AGE TIMELINE                             │ │
│         │  │                                                  │ │
│         │  │  Jane  ├──40──────────────────────────70──────┤ │ │
│         │  │  Marc  ├──42────────────────────────────72────┤ │ │
│         │  │  Emma  ├──5────────────────────────35─────────┤ │ │
│         │  │  Baby  ·············╔═══0══════════════30═════╗ │ │
│         │  │        2025        2035        2045        2055 │ │
│         │  │  [school] [university] [retirement] markers     │ │
│         │  └────────────────────────────────────────────────┘ │
│         │                                                        │
│         │  ┌─────────────────────────┐ ┌───────────────────────┐│
│         │  │ EXPENSE BREAKDOWN       │ │ REVENUE BREAKDOWN     ││
│         │  │ (@nivo/bar stacked)     │ │ (@nivo/bar stacked)   ││
│         │  │                         │ │                       ││
│         │  │ ████ ████ ████ ████     │ │ ████ ████ ████ ████  ││
│         │  │ 2025 2030 2035 2040     │ │ 2025 2030 2035 2040  ││
│         │  └─────────────────────────┘ └───────────────────────┘│
│         │                                                        │
│         │  ┌──────────────────────────────────────────────────┐ │
│         │  │  DATA TABLE                      [⬇ Export CSV]  │ │
│         │  │  [ Expenses ] [ Revenues ] [ Savings ] [ Assets ]│ │
│         │  ├──────────────┬──────────┬────────┬───────────────┤ │
│         │  │ Name         │ Category │ Amount │ Dates         │ │
│         │  ├──────────────┼──────────┼────────┼───────────────┤ │
│         │  │ Rent         │ Housing  │ €1 200 │ 01/25 → –     │ │
│         │  │ Mortgage     │ Loan     │ €1 001 │ 01/23 → 01/53 │ │
│         │  │ ...          │ ...      │ ...    │ ...           │ │
│         │  └──────────────┴──────────┴────────┴───────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

Charts stack vertically, full width. Filters collapse into a single `[Filters ▾]` button that opens a bottom drawer.

```
┌──────────────────────────┐
│ [≡]  Projections    [👤] │
├──────────────────────────┤
│ [Filters ▾]  [⬇ Export]  │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ NET WORTH            │ │
│ │ @nivo/line           │ │
│ │ height: 220px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ MONTHLY CASH FLOW    │ │
│ │ @nivo/bar            │ │
│ │ height: 180px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ CUMULATIVE SAVINGS   │ │
│ │ @nivo/line           │ │
│ │ height: 180px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ PERSON AGE TIMELINE  │ │
│ │ (horizontal bars)    │ │
│ │ height: 160px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ EXPENSE BREAKDOWN    │ │
│ │ @nivo/bar stacked    │ │
│ │ height: 180px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ REVENUE BREAKDOWN    │ │
│ │ @nivo/bar stacked    │ │
│ │ height: 180px        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ DATA TABLE (tabbed)  │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│  [■]  [■]  [■]  [■]  [⋯]│
└──────────────────────────┘
```

---

## Filters

Persistent filter bar applies to all charts simultaneously:

| Filter     | Options                                       |
| ---------- | --------------------------------------------- |
| Person     | All / Jane / Marc / Emma / (baby)             |
| Category   | All / per category                            |
| Date range | Full projection / custom range (date pickers) |

Filters stored in URL query params — shareable and bookmarkable.

---

## Charts

### 1. Net Worth Over Time — `@nivo/line`

- Lines: Net Worth (bold), Assets, Cumulative Savings, Total Debt
- Formula: `net_worth(T) = cash(T) + assets(T) − debt(T)`
- Hover: full breakdown tooltip
- Milestone annotations: vertical dashed lines for retirement ages, loan payoff dates, child births

### 2. Monthly Cash Flow — `@nivo/bar`

- Grouped bars per year (one bar = annual average monthly revenue, one = annual average monthly expense)
- Toggle between yearly and monthly granularity
- Color: revenue green, expenses red
- Stacked variant: expense bars broken down by category

### 3. Cumulative Savings — `@nivo/line`

- Starts at `initial_saving`
- One line per saving entry + total
- Target markers (horizontal dashed lines) for entries with `target_amount`
- Shows date each target is reached

### 4. Person Age Timeline — custom `@nivo/bar` (horizontal)

- One horizontal bar per person, spanning `start_date` to `end_date`
- Bar shows age label at each year tick: Jane age 40 at 2025, 50 at 2035...
- Planned children shown as dotted bar before birth, solid after
- Milestone markers on the bar:
  - School start (child age 3–5)
  - University (child age 18)
  - Retirement (adult at retirement age if set)
- Hovering a bar position shows: person name, age at that date, active revenues/expenses tied to them at that date

### 5. Expense Breakdown — `@nivo/bar` stacked

- X axis: years
- Each bar stacked by expense category
- Toggle: yearly total vs monthly average

### 6. Revenue Breakdown — `@nivo/bar` stacked

- Same structure as expense breakdown
- Optionally split by person

---

## Data Tables

Tabbed read-only table below the charts. Four tabs: Expenses, Revenues, Savings, Assets.

Columns match the respective data entry screens. Sortable, filterable. Export button downloads the active tab as CSV.

---

## Proposed Improvements

- **Scenario comparison** — fork the current budget into a "what if" scenario, overlay both projections on the same chart (dashed vs solid lines)
- **PDF export** — generate a full financial report PDF with all charts and tables (using `@react-pdf/renderer`)
- **Inflation adjustment toggle** — show all values in real (inflation-adjusted) terms using a configurable annual inflation rate
- **Key metrics sidebar** — always-visible panel on desktop showing: savings rate %, debt-to-income ratio, projected retirement balance, years until financial independence
- **Annotation pins** — allow user to drop a text note at any point on the timeline ("bought second property", "changed jobs") visible as markers on all charts
