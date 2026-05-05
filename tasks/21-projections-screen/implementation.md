# Task 21 — Projections Screen: Implementation Notes

## Status: DONE

## Files Created

| File                                             | Purpose                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `apps/web/src/pages/budgets/ProjectionsPage.tsx` | Detailed projection view with granularity toggle + person age table |

## Features

### Granularity Toggle

- Select: Monthly | Yearly
- Refetches `GET /api/budgets/:id/projection?granularity=monthly|yearly` on change
- X axis labels adapt: `"Jan '26"` for monthly, `"2026"` for yearly

### Net Worth Breakdown Chart (LineChart)

- 4 series: Net Worth (teal, filled area), Cash Balance (blue), Savings (green), Assets (orange)
- Monthly: tick every 3 months; yearly: all ticks shown
- Height 320px

### Person Age Table

- Shown only when budget has persons
- HTML table: rows = persons, columns = years in budget range
- Cell: age as integer, `—` for years before birth (null)
- `fontVariantNumeric: tabular-nums` for alignment
- Header bg `#2a2a2a`, dividers between rows

## Data Source

Single fetch per granularity change. `projection.persons` drives age table — no extra fetch needed.
