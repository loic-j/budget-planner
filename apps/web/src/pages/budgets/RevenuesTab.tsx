import { useEffect, useState, useCallback, useMemo } from 'react';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onAdd: () => void;
    onSave: () => void;
    dirty: boolean;
    saving: boolean;
  }
}

import { Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material';
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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

interface Revenue {
  id: string;
  name: string;
  categoryId: string | null;
  personId: string | null;
  amount: number;
  frequency: string;
  frequencyValue: number | null;
  startDate: string | null;
  endDate: string | null;
}

type RevRow = {
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

function monthlyRevenue(r: Revenue, year: number, month: number): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const sd = r.startDate ? new Date(r.startDate) : null;
  const ed = r.endDate ? new Date(r.endDate) : null;
  if (sd && sd > monthEnd) return 0;
  if (ed && ed < monthStart) return 0;
  switch (r.frequency) {
    case 'MONTHLY':
      return r.amount;
    case 'YEARLY':
      return r.amount / 12;
    case 'ONE_TIME':
      return sd && sd.getFullYear() === year && sd.getMonth() === month ? r.amount : 0;
    case 'EVERY_X_MONTHS':
      return r.amount / (r.frequencyValue || 1);
    case 'EVERY_X_YEARS':
      return r.amount / ((r.frequencyValue || 1) * 12);
    default:
      return 0;
  }
}

function computeChartData(
  revenues: Revenue[],
  persons: Person[],
  startDate: string,
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];

  // Person series + "Other" (unlinked)
  const personIds = persons.map((p) => p.id);
  const seriesData: Record<string, number[]> = {};
  for (const pid of personIds) seriesData[pid] = [];
  seriesData['_other'] = [];
  const total: number[] = [];

  let y = start.getFullYear(),
    m = start.getMonth();
  const ey = end.getFullYear(),
    em = end.getMonth();

  while (y < ey || (y === ey && m <= em)) {
    labels.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    let monthTotal = 0;
    for (const pid of personIds) {
      let sum = 0;
      for (const r of revenues) {
        if (r.personId === pid) sum += monthlyRevenue(r, y, m);
      }
      sum = Math.round(sum);
      seriesData[pid].push(sum);
      monthTotal += sum;
    }
    let other = 0;
    for (const r of revenues) {
      if (!r.personId) other += monthlyRevenue(r, y, m);
    }
    other = Math.round(other);
    seriesData['_other'].push(other);
    monthTotal += other;
    total.push(Math.round(monthTotal));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return { labels, seriesData, total, persons };
}

const FREQUENCY_OPTIONS = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'EVERY_X_MONTHS', label: 'Every X months' },
  { value: 'EVERY_X_YEARS', label: 'Every X years' },
];

const PERSON_COLORS = ['#42a5f5', '#ab47bc', '#26a69a', '#ffa726', '#ef5350', '#66bb6a'];

function revenueToRow(r: Revenue): RevRow {
  return {
    id: r.id,
    isNew: false,
    name: r.name,
    categoryId: r.categoryId ?? '',
    personId: r.personId ?? '',
    amount: r.amount,
    frequency: r.frequency,
    frequencyValue: r.frequencyValue,
    startDate: r.startDate ? new Date(r.startDate) : null,
    endDate: r.endDate ? new Date(r.endDate) : null,
  };
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onAdd: () => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
}

function RevenuesToolbar(props: ToolbarProps) {
  const { onAdd, onSave, dirty, saving } = props;
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
        Add row
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

interface RevenuesTabProps {
  budgetId: string;
  budget: Budget;
}

export function RevenuesTab({ budgetId, budget }: RevenuesTabProps) {
  const [revenues, setRevenues] = useState<Revenue[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [rows, setRows] = useState<RevRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [snack, setSnack] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revList, catList, perList] = await Promise.all([
        apiFetch(`/api/budgets/${budgetId}/revenues`) as Promise<Revenue[]>,
        apiFetch(`/api/budgets/${budgetId}/categories`) as Promise<Category[]>,
        apiFetch(`/api/budgets/${budgetId}/persons`) as Promise<Person[]>,
      ]);
      setRevenues(revList);
      setCategories(catList.filter((c) => c.type === 'REVENUE'));
      setPersons(perList);
      setRows(revList.map(revenueToRow));
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

  const processRowUpdate = useCallback((newRow: RevRow): RevRow => {
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
    setDirtyIds((prev) => new Set([...prev, newRow.id]));
    return newRow;
  }, []);

  function addRow() {
    const id = `new_${Date.now()}`;
    const newRow: RevRow = {
      id,
      isNew: true,
      name: 'New revenue',
      categoryId: '',
      personId: '',
      amount: 0,
      frequency: 'MONTHLY',
      frequencyValue: null,
      startDate: null,
      endDate: null,
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
          apiFetch(`/api/budgets/${budgetId}/revenues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: r.name || 'Revenue',
              ...(r.categoryId && { categoryId: r.categoryId }),
              ...(r.personId && { personId: r.personId }),
              amount: r.amount || 0,
              frequency: r.frequency || 'MONTHLY',
              ...(r.frequencyValue != null && { frequencyValue: r.frequencyValue }),
              ...(r.startDate && { startDate: r.startDate.toISOString() }),
              ...(r.endDate && { endDate: r.endDate.toISOString() }),
            }),
          })
        ),
        ...dirtyRows.map((r) =>
          apiFetch(`/api/budgets/${budgetId}/revenues/${r.id}`, {
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
            }),
          })
        ),
        ...[...deletedIds].map((id) =>
          apiFetch(`/api/budgets/${budgetId}/revenues/${id}`, { method: 'DELETE' })
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

  const [debouncedRows, setDebouncedRows] = useState<RevRow[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRows(rows), 300);
    return () => clearTimeout(t);
  }, [rows]);

  const chartRevenues = useMemo(
    (): Revenue[] =>
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
      })),
    [debouncedRows]
  );

  const chartData = useMemo(
    () => computeChartData(chartRevenues, persons, budget.startDate, budget.endDate),
    [chartRevenues, persons, budget.startDate, budget.endDate]
  );

  const catOptions = useMemo(
    () => [{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );

  const personOptions = useMemo(
    () => [{ value: '', label: '—' }, ...persons.map((p) => ({ value: p.id, label: p.name }))],
    [persons]
  );

  const columns: GridColDef<RevRow>[] = useMemo(
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
      { field: 'amount', headerName: 'Amount', editable: true, type: 'number', width: 110 },
      {
        field: 'frequency',
        headerName: 'Frequency',
        editable: true,
        width: 150,
        type: 'singleSelect',
        valueOptions: FREQUENCY_OPTIONS,
      },
      { field: 'frequencyValue', headerName: 'Freq. ×', editable: true, type: 'number', width: 80 },
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
            icon={<DeleteOutlineIcon />}
            label="Delete"
            onClick={() => deleteRow(id as string)}
            color="error"
          />,
        ],
      },
    ],
    [catOptions, personOptions]
  );

  const hasDraft = dirtyIds.size > 0 || deletedIds.size > 0;
  const tickInterval = Math.max(1, Math.floor(chartData.labels.length / 8));

  // Build chart series: one per person + "Other" + "Total"
  const chartSeries = useMemo(() => {
    const series = [];
    persons.forEach((p, i) => {
      const data = chartData.seriesData[p.id];
      if (data && data.some((v) => v > 0)) {
        series.push({
          data,
          label: p.name,
          color: PERSON_COLORS[i % PERSON_COLORS.length],
        });
      }
    });
    const otherData = chartData.seriesData['_other'];
    if (otherData && otherData.some((v) => v > 0)) {
      series.push({ data: otherData, label: 'Other', color: '#90a4ae' });
    }
    series.push({ data: chartData.total, label: 'Total', color: '#009688' });
    return series;
  }, [chartData, persons]);

  const totalMonthly = useMemo(
    () => rows.reduce((sum, r) => sum + (r.frequency === 'MONTHLY' ? r.amount : 0), 0),
    [rows]
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* ── Summary card ── */}
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
            Monthly revenue
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
            <Typography variant="h6">Revenue projection</Typography>
          </Box>
          <LineChart
            height={260}
            series={chartSeries}
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
          slots={{ toolbar: RevenuesToolbar }}
          slotProps={{
            toolbar: { onAdd: addRow, onSave: saveAll, dirty: hasDraft, saving },
          }}
          autoHeight
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Box>

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
