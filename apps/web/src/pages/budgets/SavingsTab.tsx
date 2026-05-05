import { useEffect, useState, useCallback, useMemo } from 'react';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onAdd: () => void;
    onSave: () => void;
    dirty: boolean;
    saving: boolean;
    onAddCategory: () => void;
  }
}

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { LineChart } from '@mui/x-charts/LineChart';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  id: string;
  name: string;
  currency: string;
  startDate: string;
  endDate: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Person {
  id: string;
  name: string;
}

interface Saving {
  id: string;
  name: string;
  categoryId: string | null;
  personId: string | null;
  amount: number;
  frequency: string;
  frequencyValue: number | null;
  startDate: string | null;
  endDate: string | null;
  targetAmount: number | null;
}

type SavRow = {
  id: string;
  isNew: boolean;
  name: string;
  categoryId: string;
  personId: string;
  amount: number;
  frequency: string;
  frequencyValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  targetAmount: number | null;
};

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = (body as Record<string, unknown>).error;
    let message: string;
    if (typeof err === 'string') {
      message = err;
    } else if (err && typeof err === 'object') {
      const raw = (err as Record<string, unknown>).message;
      if (typeof raw === 'string') {
        try {
          const issues = JSON.parse(raw) as Array<{ message?: string }>;
          message = issues[0]?.message ?? raw;
        } catch {
          message = raw;
        }
      } else {
        message = `HTTP ${res.status}`;
      }
    } else {
      message = `HTTP ${res.status}`;
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthlySaving(s: Saving, year: number, month: number): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const sd = s.startDate ? new Date(s.startDate) : null;
  const ed = s.endDate ? new Date(s.endDate) : null;
  if (sd && sd > monthEnd) return 0;
  if (ed && ed < monthStart) return 0;
  switch (s.frequency) {
    case 'MONTHLY':
      return s.amount;
    case 'YEARLY':
      return s.amount / 12;
    case 'ONE_TIME':
      return sd && sd.getFullYear() === year && sd.getMonth() === month ? s.amount : 0;
    case 'EVERY_X_MONTHS':
      return s.amount / (s.frequencyValue || 1);
    case 'EVERY_X_YEARS':
      return s.amount / ((s.frequencyValue || 1) * 12);
    default:
      return 0;
  }
}

function computeChartData(savings: Saving[], startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];
  const monthly: number[] = [];
  const cumulative: number[] = [];
  let y = start.getFullYear(),
    m = start.getMonth();
  const ey = end.getFullYear(),
    em = end.getMonth();
  let running = 0;
  while (y < ey || (y === ey && m <= em)) {
    labels.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    let total = 0;
    for (const s of savings) total += monthlySaving(s, y, m);
    total = Math.round(total);
    running += total;
    monthly.push(total);
    cumulative.push(running);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return { labels, monthly, cumulative };
}

const FREQUENCY_OPTIONS = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'EVERY_X_MONTHS', label: 'Every X months' },
  { value: 'EVERY_X_YEARS', label: 'Every X years' },
];

function savingToRow(s: Saving): SavRow {
  return {
    id: s.id,
    isNew: false,
    name: s.name,
    categoryId: s.categoryId ?? '',
    personId: s.personId ?? '',
    amount: s.amount,
    frequency: s.frequency,
    frequencyValue: s.frequencyValue,
    startDate: s.startDate ? new Date(s.startDate) : null,
    endDate: s.endDate ? new Date(s.endDate) : null,
    targetAmount: s.targetAmount,
  };
}

// ─── Toolbar (defined outside parent to avoid remount) ────────────────────────

interface ToolbarProps {
  onAdd: () => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
  onAddCategory: () => void;
}

function SavingsToolbar(props: ToolbarProps) {
  const { onAdd, onSave, dirty, saving, onAddCategory } = props;
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
        Add row
      </Button>
      <Button size="small" startIcon={<AddIcon />} onClick={onAddCategory} color="inherit">
        Category
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
        onClick={onSave}
        disabled={!dirty || saving}
      >
        Save all
      </Button>
      <Box sx={{ flex: 1 }} />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

interface SavingsTabProps {
  budgetId: string;
  budget: Budget;
}

export function SavingsTab({ budgetId, budget }: SavingsTabProps) {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState<SavRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [snack, setSnack] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [savList, catList, perList] = await Promise.all([
        apiFetch(`/api/budgets/${budgetId}/savings`) as Promise<Saving[]>,
        apiFetch(`/api/budgets/${budgetId}/categories`) as Promise<Category[]>,
        apiFetch(`/api/budgets/${budgetId}/persons`) as Promise<Person[]>,
      ]);
      setSavings(savList);
      setCategories(catList.filter((c) => c.type === 'SAVING'));
      setPersons(perList);
      setRows(savList.map(savingToRow));
      setDirtyIds(new Set());
      setDeletedIds(new Set());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processRowUpdate = useCallback((newRow: SavRow): SavRow => {
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
    setDirtyIds((prev) => new Set([...prev, newRow.id]));
    return newRow;
  }, []);

  function addRow() {
    const id = `new_${Date.now()}`;
    const newRow: SavRow = {
      id,
      isNew: true,
      name: 'New saving',
      categoryId: '',
      personId: '',
      amount: 0,
      frequency: 'MONTHLY',
      frequencyValue: null,
      startDate: null,
      endDate: null,
      targetAmount: null,
    };
    setRows((prev) => [...prev, newRow]);
    setDirtyIds((prev) => new Set([...prev, id]));
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (id.startsWith('new_')) {
      setDirtyIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    } else {
      setDeletedIds((prev) => new Set([...prev, id]));
    }
  }

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      const newRows = rows.filter((r) => r.isNew && dirtyIds.has(r.id));
      const dirtyRows = rows.filter((r) => !r.isNew && dirtyIds.has(r.id));

      if ([...newRows, ...dirtyRows].some((r) => !(r.amount > 0))) {
        setSnack('Amount must be greater than 0');
        setSaving(false);
        return;
      }

      await Promise.all([
        ...newRows.map((r) =>
          apiFetch(`/api/budgets/${budgetId}/savings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: r.name || 'Saving',
              ...(r.categoryId && { categoryId: r.categoryId }),
              ...(r.personId && { personId: r.personId }),
              amount: r.amount || 0,
              frequency: r.frequency || 'MONTHLY',
              ...(r.frequencyValue != null && { frequencyValue: r.frequencyValue }),
              ...(r.startDate && { startDate: r.startDate.toISOString() }),
              ...(r.endDate && { endDate: r.endDate.toISOString() }),
              ...(r.targetAmount != null && { targetAmount: r.targetAmount }),
            }),
          })
        ),
        ...dirtyRows.map((r) =>
          apiFetch(`/api/budgets/${budgetId}/savings/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: r.name,
              categoryId: r.categoryId || null,
              personId: r.personId || null,
              amount: r.amount,
              frequency: r.frequency,
              frequencyValue: r.frequencyValue,
              startDate: r.startDate?.toISOString() ?? null,
              endDate: r.endDate?.toISOString() ?? null,
              targetAmount: r.targetAmount,
            }),
          })
        ),
        ...[...deletedIds].map((id) =>
          apiFetch(`/api/budgets/${budgetId}/savings/${id}`, { method: 'DELETE' })
        ),
      ]);

      await loadData();
      setSnack('Saved');
    } catch (e) {
      setSnack('Save failed: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [rows, dirtyIds, deletedIds, budgetId, loadData]);

  async function handleCreateCategory() {
    setSavingCat(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SAVING', name: newCatName.trim(), icon: 'other' }),
      });
      const catList = await apiFetch(`/api/budgets/${budgetId}/categories`);
      setCategories((catList as Category[]).filter((c) => c.type === 'SAVING'));
      setNewCatName('');
      setCatDialogOpen(false);
    } catch (e) {
      setSnack('Failed to create category: ' + (e as Error).message);
    } finally {
      setSavingCat(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const hasDraft = dirtyIds.size > 0 || deletedIds.size > 0;
        if (hasDraft && !saving) saveAll();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirtyIds, deletedIds, saving, saveAll]);

  // Debounce row changes for chart (300ms)
  const [debouncedRows, setDebouncedRows] = useState<SavRow[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRows(rows), 300);
    return () => clearTimeout(t);
  }, [rows]);

  const chartSavings = useMemo(
    (): Saving[] =>
      debouncedRows.map((r) => ({
        id: r.id,
        name: r.name,
        categoryId: r.categoryId || null,
        personId: r.personId || null,
        amount: r.amount,
        frequency: r.frequency,
        frequencyValue: r.frequencyValue,
        startDate: r.startDate ? r.startDate.toISOString() : null,
        endDate: r.endDate ? r.endDate.toISOString() : null,
        targetAmount: r.targetAmount,
      })),
    [debouncedRows]
  );

  const chartData = useMemo(
    () => computeChartData(chartSavings, budget.startDate, budget.endDate),
    [chartSavings, budget.startDate, budget.endDate]
  );

  const catOptions = useMemo(
    () => [{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );

  const personOptions = useMemo(
    () => [{ value: '', label: '—' }, ...persons.map((p) => ({ value: p.id, label: p.name }))],
    [persons]
  );

  const columns: GridColDef<SavRow>[] = useMemo(
    () => [
      { field: 'name', headerName: 'Name', editable: true, flex: 1, minWidth: 140 },
      {
        field: 'categoryId',
        headerName: 'Category',
        editable: true,
        width: 150,
        type: 'singleSelect',
        valueOptions: catOptions,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        editable: true,
        type: 'number',
        width: 100,
      },
      {
        field: 'frequency',
        headerName: 'Frequency',
        editable: true,
        width: 150,
        type: 'singleSelect',
        valueOptions: FREQUENCY_OPTIONS,
      },
      {
        field: 'frequencyValue',
        headerName: 'Freq. ×',
        editable: true,
        type: 'number',
        width: 80,
      },
      {
        field: 'targetAmount',
        headerName: 'Target',
        editable: true,
        type: 'number',
        width: 110,
      },
      {
        field: 'personId',
        headerName: 'Person',
        editable: true,
        width: 130,
        type: 'singleSelect',
        valueOptions: personOptions,
      },
      { field: 'startDate', headerName: 'Start', editable: true, type: 'date', width: 120 },
      { field: 'endDate', headerName: 'End', editable: true, type: 'date', width: 120 },
      {
        field: 'actions',
        type: 'actions',
        width: 50,
        getActions: ({ id }) => [
          <GridActionsCellItem
            key="del"
            icon={<DeleteOutlineIcon sx={{ color: 'error.main' }} />}
            label="Delete"
            onClick={() => deleteRow(id as string)}
          />,
        ],
      },
    ],
    [catOptions, personOptions]
  );

  const hasDraft = dirtyIds.size > 0 || deletedIds.size > 0;
  const tickInterval = Math.max(1, Math.floor(chartData.labels.length / 8));

  // Summary stat: total monthly savings
  const totalMonthly = useMemo(
    () => rows.reduce((sum, r) => sum + (r.frequency === 'MONTHLY' ? r.amount : 0), 0),
    [rows]
  );

  // Savings count by target status
  const withTarget = savings.filter((s) => s.targetAmount != null).length;

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* ── Summary cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: '16px 20px',
            minWidth: 160,
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Monthly savings
          </Typography>
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 600,
              color: 'success.main',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalMonthly.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{' '}
            {budget.currency}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: '16px 20px',
            minWidth: 160,
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Goals with target
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {withTarget} / {savings.length}
          </Typography>
        </Box>
      </Box>

      {/* ── Projection chart ── */}
      {chartData.labels.length > 0 && (
        <Box
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 3, pt: 2 }}>
            <Typography variant="h6">Savings projection</Typography>
          </Box>
          <LineChart
            height={260}
            series={[
              { data: chartData.monthly, label: 'Monthly', color: '#42a5f5' },
              { data: chartData.cumulative, label: 'Cumulative', color: '#009688' },
            ]}
            xAxis={[
              {
                data: chartData.labels,
                scaleType: 'band',
                tickInterval: (_v: unknown, i: number) => i % tickInterval === 0,
              },
            ]}
          />
        </Box>
      )}

      {/* ── DataGrid ── */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          '& .row-dirty': { borderLeft: '3px solid', borderLeftColor: 'warning.main' },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="cell"
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(e) => setSnack((e as Error).message)}
          getRowClassName={(p) => (dirtyIds.has(p.id as string) ? 'row-dirty' : '')}
          showToolbar
          slots={{ toolbar: SavingsToolbar }}
          slotProps={{
            toolbar: {
              onAdd: addRow,
              onSave: saveAll,
              dirty: hasDraft,
              saving,
              onAddCategory: () => setCatDialogOpen(true),
            },
          }}
          autoHeight
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Box>

      {/* ── Create category dialog ── */}
      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New saving category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCatName.trim()) handleCreateCategory();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setCatDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newCatName.trim() || savingCat}
            onClick={handleCreateCategory}
          >
            {savingCat ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
