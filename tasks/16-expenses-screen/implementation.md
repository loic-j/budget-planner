# Task 16 — Implementation Notes

## Local draft state shape

```typescript
type RegRow = {
  id: string; // real DB id or `new_${Date.now()}` for unsaved rows
  isNew: boolean; // true = not yet POSTed to API
  name: string;
  categoryId: string; // '' instead of null (DataGrid singleSelect + null = broken)
  personId: string; // '' instead of null
  amount: number;
  frequency: string;
  frequencyValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

// Three sets drive dirty/delete tracking:
const [rows, setRows]; // full list (visible in DataGrid)
const [dirtyIds, setDirtyIds]; // Set<string> — added + modified row ids
const [deletedIds, setDeletedIds]; // Set<string> — removed existing row ids
```

`addRow()` generates a `new_${Date.now()}` id and adds to both `rows` and `dirtyIds`.
`processRowUpdate` (DataGrid callback) updates `rows` and adds to `dirtyIds`.
`deleteRow` removes from `rows`; new rows also removed from `dirtyIds`, existing rows added to `deletedIds`.

## Debounce approach

Chart must not recompute on every keystroke. Implemented with a `useState` + `useEffect` + `setTimeout`:

```typescript
const [debouncedRows, setDebouncedRows] = useState<RegRow[]>([]);
useEffect(() => {
  const t = setTimeout(() => setDebouncedRows(rows), 300);
  return () => clearTimeout(t);
}, [rows]);
```

`chartExpenses` is derived from `debouncedRows` (regular) + loan expenses from the server state. The chart `useMemo` depends on `chartExpenses`, so it only recomputes after the 300ms debounce fires.

**Key bug fixed during implementation**: the initial version computed chart from `expenses` (API state). This meant the chart never updated until Save All. Fix: compute from `debouncedRows` + server loans.

## Batch save implementation

`saveAll()` fires one `Promise.all` with three parallel batches:

```typescript
await Promise.all([
  // POST all new rows
  ...newRows.map(r => apiFetch(`/api/budgets/${budgetId}/expenses`, { method: 'POST', ... })),
  // PATCH all dirty existing rows
  ...dirtyRows.map(r => apiFetch(`/api/budgets/${budgetId}/expenses/${r.id}/regular`, { method: 'PATCH', ... })),
  // DELETE all removed existing rows
  ...[...deletedIds].map(id => apiFetch(`/api/budgets/${budgetId}/expenses/${id}`, { method: 'DELETE' })),
]);
await loadData(); // reloads from API, clears dirtyIds + deletedIds
```

Empty string FK fields (`categoryId: ''`, `personId: ''`) converted back to `null` on save:

```typescript
categoryId: r.categoryId || null;
personId: r.personId || null;
```

Ctrl+S shortcut: `window.addEventListener('keydown', ...)` in a `useEffect` that closes over `saveAll`.

## Client-side PMT formula

Located in `calcPMT()` helper in ExpensesTab.tsx (same formula as backend):

```typescript
function calcPMT(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round((principal / months) * 100) / 100;
  const r = annualRate / 100 / 12;
  const f = Math.pow(1 + r, months);
  return Math.round(((principal * r * f) / (f - 1)) * 100) / 100;
}
```

Used in `AddLoanDrawer` via `useMemo` — recomputes on every change to totalAmount, interestRate, or durationMonths.

## Toolbar remount fix

`RegularToolbar` is defined at module level (outside the parent component). If defined inside, React creates a new component type on every parent render, causing the DataGrid to unmount/remount the toolbar and lose focus.

## DataGrid singleSelect + null

MUI DataGrid `singleSelect` columns do not handle `null` values cleanly (renders broken). All FK fields use `''` (empty string) in row state, with a `{ value: '', label: '—' }` option added at the top of `valueOptions`.
