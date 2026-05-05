import { useEffect, useState, useCallback, useMemo } from 'react';

// Augment DataGrid's slot props so custom toolbar props type-check correctly
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onAdd: () => void;
    onSave: () => void;
    dirty: boolean;
    saving: boolean;
    onAddCategory: (e: React.MouseEvent<HTMLElement>) => void;
  }
}
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Tab,
  TablePagination,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { CategoryManager } from '@/components/CategoryManager';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartRangeBrush } from '@/components/charts/ChartRangeBrush';
import type { ChartGranularity } from '@/components/charts/ChartRangeBrush';
import { ChartCategoryFilter } from '@/components/charts/ChartCategoryFilter';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';

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

interface LoanDetail {
  id: string;
  loanType: string;
  totalAmount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  loanStartDate: string;
}

interface Expense {
  id: string;
  type: 'REGULAR' | 'LOAN';
  name: string;
  categoryId: string | null;
  personId: string | null;
  amount: number;
  frequency: string;
  frequencyValue: number | null;
  startDate: string | null;
  endDate: string | null;
  loanDetail: LoanDetail | null;
}

interface LoanPayment {
  id: string;
  paymentNumber: number;
  paymentDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

// DataGrid row type — uses '' for null FK fields (DataGrid singleSelect + null = problematic)
type RegRow = {
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

function calcPMT(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round((principal / months) * 100) / 100;
  const r = annualRate / 100 / 12;
  const f = Math.pow(1 + r, months);
  return Math.round(((principal * r * f) / (f - 1)) * 100) / 100;
}

function monthlyAmount(e: Expense, year: number, month: number): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const sd = e.startDate ? new Date(e.startDate) : null;
  const ed = e.endDate ? new Date(e.endDate) : null;
  if (sd && sd > monthEnd) return 0;
  if (ed && ed < monthStart) return 0;
  switch (e.frequency) {
    case 'MONTHLY':
      return e.amount;
    case 'YEARLY':
      return e.amount / 12;
    case 'ONE_TIME':
      return sd && sd.getFullYear() === year && sd.getMonth() === month ? e.amount : 0;
    case 'EVERY_X_MONTHS':
      return e.amount / (e.frequencyValue || 1);
    case 'EVERY_X_YEARS':
      return e.amount / ((e.frequencyValue || 1) * 12);
    default:
      return 0;
  }
}

function computeChartData(expenses: Expense[], startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];
  const regular: number[] = [];
  const loans: number[] = [];
  let y = start.getFullYear(),
    m = start.getMonth();
  const ey = end.getFullYear(),
    em = end.getMonth();
  while (y < ey || (y === ey && m <= em)) {
    labels.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    let reg = 0,
      loan = 0;
    for (const e of expenses) {
      const amt = monthlyAmount(e, y, m);
      if (e.type === 'REGULAR') reg += amt;
      else loan += amt;
    }
    regular.push(Math.round(reg));
    loans.push(Math.round(loan));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return { labels, regular, loans, total: regular.map((r, i) => r + loans[i]) };
}

const RECURRING_FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'EVERY_X_MONTHS', label: 'Every X months' },
  { value: 'EVERY_X_YEARS', label: 'Every X years' },
];

const LOAN_TYPE_LABELS: Record<string, string> = {
  MORTGAGE: 'Mortgage',
  CAR_LOAN: 'Car loan',
  PERSONAL: 'Personal',
  STUDENT: 'Student',
  OTHER: 'Other',
};

function expenseToRow(e: Expense): RegRow {
  return {
    id: e.id,
    isNew: false,
    name: e.name,
    categoryId: e.categoryId ?? '',
    personId: e.personId ?? '',
    amount: e.amount,
    frequency: e.frequency,
    frequencyValue: e.frequencyValue,
    startDate: e.startDate ? new Date(e.startDate) : null,
    endDate: e.endDate ? new Date(e.endDate) : null,
  };
}

// ─── Toolbar (defined outside parent to avoid remount) ────────────────────────

interface ToolbarProps {
  onAdd: () => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
  onAddCategory: (e: React.MouseEvent<HTMLElement>) => void;
}

function RegularToolbar(props: ToolbarProps) {
  const { onAdd, onSave, dirty, saving, onAddCategory } = props;
  return (
    <GridToolbarContainer sx={{ px: 2, py: 1, gap: 1 }}>
      <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
        Add row
      </Button>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={(e) => onAddCategory(e as React.MouseEvent<HTMLElement>)}
        color="inherit"
      >
        Categories
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

// ─── AddLoanDrawer ────────────────────────────────────────────────────────────

interface AddLoanDrawerProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  persons: Person[];
  currency: string;
  onCreated: () => void;
}

function AddLoanDrawer({
  open,
  onClose,
  budgetId,
  persons,
  currency,
  onCreated,
}: AddLoanDrawerProps) {
  const [name, setName] = useState('');
  const [loanType, setLoanType] = useState('MORTGAGE');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [loanStartDate, setLoanStartDate] = useState('');
  const [personId, setPersonId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pmt = useMemo(() => {
    const p = parseFloat(totalAmount);
    const r = parseFloat(interestRate);
    const m = parseInt(durationMonths);
    if (!p || isNaN(p) || p <= 0 || isNaN(r) || r < 0 || !m || m <= 0) return null;
    return calcPMT(p, r, m);
  }, [totalAmount, interestRate, durationMonths]);

  async function handleCreate() {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/budgets/${budgetId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOAN',
          name,
          loanType,
          totalAmount: parseFloat(totalAmount),
          interestRate: parseFloat(interestRate),
          durationMonths: parseInt(durationMonths),
          loanStartDate: new Date(loanStartDate).toISOString(),
          ...(personId && { personId }),
        }),
      });
      onCreated();
      onClose();
      setName('');
      setTotalAmount('');
      setInterestRate('');
      setDurationMonths('');
      setLoanStartDate('');
      setPersonId('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const canCreate =
    !!name && !!totalAmount && !!interestRate && !!durationMonths && !!loanStartDate;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">Add loan</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />

        <FormControl fullWidth size="small">
          <InputLabel>Loan type</InputLabel>
          <Select value={loanType} label="Loan type" onChange={(e) => setLoanType(e.target.value)}>
            {Object.entries(LOAN_TYPE_LABELS).map(([v, l]) => (
              <MenuItem key={v} value={v}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={`Total amount (${currency})`}
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          type="number"
          fullWidth
          size="small"
        />
        <TextField
          label="Annual interest rate (%)"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          type="number"
          fullWidth
          size="small"
        />
        <TextField
          label="Duration (months)"
          value={durationMonths}
          onChange={(e) => setDurationMonths(e.target.value)}
          type="number"
          fullWidth
          size="small"
        />
        <TextField
          label="Start date"
          value={loanStartDate}
          onChange={(e) => setLoanStartDate(e.target.value)}
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {persons.length > 0 && (
          <FormControl fullWidth size="small">
            <InputLabel>Person (optional)</InputLabel>
            <Select
              value={personId}
              label="Person (optional)"
              onChange={(e) => setPersonId(e.target.value)}
            >
              <MenuItem value="">—</MenuItem>
              {persons.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {pmt !== null && (
          <Box
            sx={{
              bgcolor: 'background.default',
              borderRadius: 1,
              px: 2,
              py: 1.5,
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Monthly payment
            </Typography>
            <Typography
              variant="h4"
              color="primary.main"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {pmt.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {currency}
            </Typography>
          </Box>
        )}

        {error && (
          <Typography color="error.main" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={saving || !canCreate}
          fullWidth
        >
          {saving ? <CircularProgress size={20} /> : 'Create loan'}
        </Button>
      </Box>
    </Drawer>
  );
}

// ─── LoanAmortizationPanel ────────────────────────────────────────────────────

function LoanAmortizationPanel({ budgetId, expenseId }: { budgetId: string; expenseId: string }) {
  const [schedule, setSchedule] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PER_PAGE = 12;

  useEffect(() => {
    apiFetch(`/api/budgets/${budgetId}/expenses/${expenseId}/loan-schedule`)
      .then((d) => setSchedule(d as LoanPayment[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [budgetId, expenseId]);

  if (loading)
    return (
      <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={20} />
      </Box>
    );

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paginated = schedule.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <Box sx={{ bgcolor: 'background.default', px: 2, pb: 1 }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
          '& th': { color: 'text.secondary', fontWeight: 600, textAlign: 'left', py: 0.75, px: 1 },
          '& td': { py: 0.5, px: 1, fontVariantNumeric: 'tabular-nums' },
          '& td:not(:first-of-type)': { textAlign: 'right' },
        }}
      >
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th style={{ textAlign: 'right' }}>Payment</th>
            <th style={{ textAlign: 'right' }}>Principal</th>
            <th style={{ textAlign: 'right' }}>Interest</th>
            <th style={{ textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((p) => (
            <tr key={p.id}>
              <td>{p.paymentNumber}</td>
              <td>
                {new Date(p.paymentDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                })}
              </td>
              <td>{fmt(p.amount)}</td>
              <td>{fmt(p.principalAmount)}</td>
              <td>{fmt(p.interestAmount)}</td>
              <td>{fmt(p.remainingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      <TablePagination
        component="div"
        count={schedule.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={PER_PAGE}
        rowsPerPageOptions={[PER_PAGE]}
        sx={{ fontSize: 12 }}
      />
    </Box>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

interface ExpensesTabProps {
  budgetId: string;
  budget: Budget;
}

export function ExpensesTab({ budgetId, budget }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Regular grid draft state
  const [rows, setRows] = useState<RegRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Loans UI state
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const [snack, setSnack] = useState<string | null>(null);
  const [catAnchorEl, setCatAnchorEl] = useState<HTMLElement | null>(null);

  const [chartStart, setChartStart] = useState(() => budget.startDate.slice(0, 7));
  const [chartEnd, setChartEnd] = useState(() => budget.endDate.slice(0, 7));
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('monthly');
  const [selectedChartCategories, setSelectedChartCategories] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expList, catList, perList] = await Promise.all([
        apiFetch(`/api/budgets/${budgetId}/expenses`) as Promise<Expense[]>,
        apiFetch(`/api/budgets/${budgetId}/categories`) as Promise<Category[]>,
        apiFetch(`/api/budgets/${budgetId}/persons`) as Promise<Person[]>,
      ]);
      setExpenses(expList);
      setCategories(catList.filter((c) => c.type === 'EXPENSE'));
      setPersons(perList);
      setRows(expList.filter((e) => e.type === 'REGULAR').map(expenseToRow));
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

  const processRowUpdate = useCallback((newRow: RegRow): RegRow => {
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
    setDirtyIds((prev) => new Set([...prev, newRow.id]));
    return newRow;
  }, []);

  function addRow() {
    const id = `new_${Date.now()}`;
    const newRow: RegRow = {
      id,
      isNew: true,
      name: 'New expense',
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

  function addOneTimeRow() {
    const id = `new_${Date.now()}`;
    const newRow: RegRow = {
      id,
      isNew: true,
      name: 'New expense',
      categoryId: '',
      personId: '',
      amount: 0,
      frequency: 'ONE_TIME',
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
          apiFetch(`/api/budgets/${budgetId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'REGULAR',
              name: r.name || 'Expense',
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
          apiFetch(`/api/budgets/${budgetId}/expenses/${r.id}/regular`, {
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
          apiFetch(`/api/budgets/${budgetId}/expenses/${id}`, { method: 'DELETE' })
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

  // Ctrl+S to save
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
  const [debouncedRows, setDebouncedRows] = useState<RegRow[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRows(rows), 300);
    return () => clearTimeout(t);
  }, [rows]);

  const chartExpenses = useMemo((): Expense[] => {
    const draftRegular: Expense[] = debouncedRows.map((r) => ({
      id: r.id,
      type: 'REGULAR',
      name: r.name,
      categoryId: r.categoryId || null,
      personId: r.personId || null,
      amount: r.amount,
      frequency: r.frequency,
      frequencyValue: r.frequencyValue,
      startDate: r.startDate ? r.startDate.toISOString() : null,
      endDate: r.endDate ? r.endDate.toISOString() : null,
      loanDetail: null,
    }));
    return [...draftRegular, ...expenses.filter((e) => e.type === 'LOAN')];
  }, [debouncedRows, expenses]);

  const hasUncategorized = useMemo(() => chartExpenses.some((e) => !e.categoryId), [chartExpenses]);

  const filteredChartExpenses = useMemo(
    () =>
      selectedChartCategories.size === 0
        ? chartExpenses
        : chartExpenses.filter((e) => selectedChartCategories.has(e.categoryId ?? '')),
    [chartExpenses, selectedChartCategories]
  );

  const chartData = useMemo(
    () => computeChartData(filteredChartExpenses, budget.startDate, budget.endDate),
    [filteredChartExpenses, budget.startDate, budget.endDate]
  );

  const displayChart = useMemo(() => {
    const filtered = chartData.labels
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => l >= chartStart && l <= chartEnd);
    if (chartGranularity === 'monthly') {
      return {
        labels: filtered.map(({ l }) => l),
        regular: filtered.map(({ i }) => chartData.regular[i]),
        loans: filtered.map(({ i }) => chartData.loans[i]),
        total: filtered.map(({ i }) => chartData.total[i]),
      };
    }
    const byYear: Record<string, { regular: number; loans: number; total: number }> = {};
    filtered.forEach(({ l, i }) => {
      const yr = l.slice(0, 4);
      if (!byYear[yr]) byYear[yr] = { regular: 0, loans: 0, total: 0 };
      byYear[yr].regular += chartData.regular[i];
      byYear[yr].loans += chartData.loans[i];
      byYear[yr].total += chartData.total[i];
    });
    const years = Object.keys(byYear).sort();
    return {
      labels: years,
      regular: years.map((yr) => byYear[yr].regular),
      loans: years.map((yr) => byYear[yr].loans),
      total: years.map((yr) => byYear[yr].total),
    };
  }, [chartData, chartStart, chartEnd, chartGranularity]);

  const catOptions = useMemo(
    () => [{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );

  const personOptions = useMemo(
    () => [{ value: '', label: '—' }, ...persons.map((p) => ({ value: p.id, label: p.name }))],
    [persons]
  );

  const columns: GridColDef<RegRow>[] = useMemo(
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
        valueOptions: RECURRING_FREQUENCY_OPTIONS,
      },
      {
        field: 'frequencyValue',
        headerName: 'Every N',
        editable: true,
        type: 'number',
        width: 90,
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

  const oneTimeColumns: GridColDef<RegRow>[] = useMemo(
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
      { field: 'amount', headerName: 'Amount', editable: true, type: 'number', width: 100 },
      {
        field: 'personId',
        headerName: 'Person',
        editable: true,
        width: 130,
        type: 'singleSelect',
        valueOptions: personOptions,
      },
      { field: 'startDate', headerName: 'Date', editable: true, type: 'date', width: 130 },
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

  const loanExpenses = expenses.filter((e) => e.type === 'LOAN');
  const recurringRows = rows.filter((r) => r.frequency !== 'ONE_TIME');
  const oneTimeRows = rows.filter((r) => r.frequency === 'ONE_TIME');
  const hasDraft = dirtyIds.size > 0 || deletedIds.size > 0;
  const tickInterval = Math.max(1, Math.floor(displayChart.labels.length / 8));

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
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
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <Typography variant="h6">Monthly expense projection</Typography>
          </Box>
          <ChartCategoryFilter
            categories={categories}
            selected={selectedChartCategories}
            hasUncategorized={hasUncategorized}
            onChange={setSelectedChartCategories}
          />
          <LineChart
            height={260}
            series={[
              { data: displayChart.regular, label: 'Recurring', color: '#42a5f5' },
              { data: displayChart.loans, label: 'Loans', color: '#ef5350' },
              { data: displayChart.total, label: 'Total', color: '#009688' },
            ]}
            xAxis={[
              {
                data: displayChart.labels,
                scaleType: 'band',
                tickInterval: (_v: unknown, i: number) => i % tickInterval === 0,
              },
            ]}
          />
          <ChartRangeBrush
            minMonth={budget.startDate.slice(0, 7)}
            maxMonth={budget.endDate.slice(0, 7)}
            startMonth={chartStart}
            endMonth={chartEnd}
            granularity={chartGranularity}
            onRangeChange={(s, e) => {
              setChartStart(s);
              setChartEnd(e);
            }}
            onGranularityChange={setChartGranularity}
          />
        </Box>
      )}

      {/* ── Sub-tabs: Recurring / One-time / Loans ── */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v as number)} sx={{ mb: 2 }}>
        <Tab label={`Recurring (${recurringRows.length})`} />
        <Tab label={`One-time (${oneTimeRows.length})`} />
        <Tab label={`Loans (${loanExpenses.length})`} />
      </Tabs>

      {/* ── Recurring expenses DataGrid ── */}
      {activeTab === 0 && (
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
            rows={recurringRows}
            columns={columns}
            editMode="cell"
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(e) => setSnack((e as Error).message)}
            getRowClassName={(p) => (dirtyIds.has(p.id as string) ? 'row-dirty' : '')}
            showToolbar
            slots={{ toolbar: RegularToolbar }}
            slotProps={{
              toolbar: {
                onAdd: addRow,
                onSave: saveAll,
                dirty: hasDraft,
                saving,
                onAddCategory: (e) => setCatAnchorEl(e.currentTarget),
              },
            }}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Box>
      )}

      {/* ── One-time expenses DataGrid ── */}
      {activeTab === 1 && (
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
            rows={oneTimeRows}
            columns={oneTimeColumns}
            editMode="cell"
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(e) => setSnack((e as Error).message)}
            getRowClassName={(p) => (dirtyIds.has(p.id as string) ? 'row-dirty' : '')}
            showToolbar
            slots={{ toolbar: RegularToolbar }}
            slotProps={{
              toolbar: {
                onAdd: addOneTimeRow,
                onSave: saveAll,
                dirty: hasDraft,
                saving,
                onAddCategory: (e) => setCatAnchorEl(e.currentTarget),
              },
            }}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Box>
      )}

      {/* ── Loans section ── */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setLoanDrawerOpen(true)}
            >
              Add loan
            </Button>
          </Box>

          {loanExpenses.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
              No loans yet. Click "Add loan" to create one.
            </Typography>
          ) : (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {loanExpenses.map((loan, i) => (
                <Box key={loan.id}>
                  {i > 0 && <Divider />}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    }}
                    onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {loan.name}
                        </Typography>
                        {loan.loanDetail && (
                          <Chip
                            label={
                              LOAN_TYPE_LABELS[loan.loanDetail.loanType] ?? loan.loanDetail.loanType
                            }
                            size="small"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                      {loan.loanDetail && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {loan.loanDetail.totalAmount.toLocaleString()} {budget.currency} ·{' '}
                          {loan.loanDetail.interestRate}% · {loan.loanDetail.durationMonths} mo ·{' '}
                          <strong>
                            {loan.loanDetail.monthlyPayment.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {budget.currency}/mo
                          </strong>
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      title="Delete loan"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await apiFetch(`/api/budgets/${budgetId}/expenses/${loan.id}`, {
                          method: 'DELETE',
                        });
                        if (expandedLoanId === loan.id) setExpandedLoanId(null);
                        await loadData();
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                    {expandedLoanId === loan.id ? (
                      <ExpandLessIcon sx={{ color: 'text.secondary' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
                    )}
                  </Box>
                  <Collapse in={expandedLoanId === loan.id} unmountOnExit>
                    <LoanAmortizationPanel budgetId={budgetId} expenseId={loan.id} />
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      <AddLoanDrawer
        open={loanDrawerOpen}
        onClose={() => setLoanDrawerOpen(false)}
        budgetId={budgetId}
        persons={persons}
        currency={budget.currency}
        onCreated={loadData}
      />

      <CategoryManager
        anchorEl={catAnchorEl}
        onClose={() => setCatAnchorEl(null)}
        budgetId={budgetId}
        categoryType="EXPENSE"
        categories={categories}
        onCategoryChange={loadData}
      />

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
