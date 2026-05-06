import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartRangeBrush } from '@/components/charts/ChartRangeBrush';
import type { ChartGranularity } from '@/components/charts/ChartRangeBrush';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  id: string;
  name: string;
  currency: string;
  startDate: string;
  endDate: string;
}

type AssetType = 'REAL_ESTATE' | 'INVESTMENT' | 'VEHICLE' | 'OTHER';
type SourceType = 'none' | 'revenue' | 'expense' | 'loan';

interface Asset {
  id: string;
  budgetId: string;
  type: AssetType;
  name: string;
  currentValue: number;
  acquisitionDate: string;
  annualGrowthRate: number;
  loanDetailId: string | null;
  sourceRevenueId: string | null;
  sourceExpenseId: string | null;
}

interface Revenue {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  name: string;
  type: string;
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function assetValueAt(asset: Asset, date: Date): number {
  const acquisition = new Date(asset.acquisitionDate);
  if (date < acquisition) return 0;
  const factor = 1 + asset.annualGrowthRate / 100;
  if (factor <= 0) return 0;
  const years = (date.getTime() - acquisition.getTime()) / MS_PER_YEAR;
  return Math.max(0, asset.currentValue * Math.pow(factor, years));
}

const ASSET_TYPE_KEYS: AssetType[] = ['REAL_ESTATE', 'INVESTMENT', 'VEHICLE', 'OTHER'];

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  REAL_ESTATE: '#009688',
  INVESTMENT: '#42a5f5',
  VEHICLE: '#ffa726',
  OTHER: '#90a4ae',
};

function computeChartData(assets: Asset[], startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels: string[] = [];
  const seriesData: Record<string, number[]> = {};
  for (const a of assets) seriesData[a.id] = [];
  const total: number[] = [];

  let y = start.getFullYear(),
    m = start.getMonth();
  const ey = end.getFullYear(),
    em = end.getMonth();

  while (y < ey || (y === ey && m <= em)) {
    labels.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    const date = new Date(y, m, 1);
    let monthTotal = 0;
    for (const a of assets) {
      const v = Math.round(assetValueAt(a, date));
      seriesData[a.id].push(v);
      monthTotal += v;
    }
    total.push(Math.round(monthTotal));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return { labels, seriesData, total };
}

// ─── Add/Edit Drawer ──────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  currency: string;
  editAsset: Asset | null;
  revenues: Revenue[];
  expenses: Expense[];
  onSaved: () => void;
}

const SOURCE_TYPES: SourceType[] = ['none', 'revenue', 'expense', 'loan'];

function AssetDrawer({
  open,
  onClose,
  budgetId,
  currency,
  editAsset,
  revenues,
  expenses,
  onSaved,
}: DrawerProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<AssetType>('REAL_ESTATE');
  const [name, setName] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [annualGrowthRate, setAnnualGrowthRate] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('none');
  const [sourceRevenueId, setSourceRevenueId] = useState<string>('');
  const [sourceExpenseId, setSourceExpenseId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editAsset) {
      setType(editAsset.type);
      setName(editAsset.name);
      setCurrentValue(String(editAsset.currentValue));
      setAcquisitionDate(editAsset.acquisitionDate.slice(0, 10));
      setAnnualGrowthRate(String(editAsset.annualGrowthRate));
      if (editAsset.sourceRevenueId) {
        setSourceType('revenue');
        setSourceRevenueId(editAsset.sourceRevenueId);
        setSourceExpenseId('');
      } else if (editAsset.sourceExpenseId) {
        setSourceType('expense');
        setSourceExpenseId(editAsset.sourceExpenseId);
        setSourceRevenueId('');
      } else if (editAsset.loanDetailId) {
        setSourceType('loan');
        setSourceRevenueId('');
        setSourceExpenseId('');
      } else {
        setSourceType('none');
        setSourceRevenueId('');
        setSourceExpenseId('');
      }
    } else {
      setType('REAL_ESTATE');
      setName('');
      setCurrentValue('');
      setAcquisitionDate('');
      setAnnualGrowthRate('0');
      setSourceType('none');
      setSourceRevenueId('');
      setSourceExpenseId('');
    }
    setError('');
  }, [editAsset, open]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        type,
        name,
        currentValue: parseFloat(currentValue),
        acquisitionDate: new Date(acquisitionDate).toISOString(),
        annualGrowthRate: parseFloat(annualGrowthRate),
        sourceRevenueId: sourceType === 'revenue' ? sourceRevenueId || null : null,
        sourceExpenseId: sourceType === 'expense' ? sourceExpenseId || null : null,
      };
      if (editAsset) {
        await apiFetch(`/api/budgets/${budgetId}/assets/${editAsset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/api/budgets/${budgetId}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const cashExpenses = useMemo(() => expenses.filter((e) => e.type !== 'LOAN'), [expenses]);

  const canSave =
    !!name && parseFloat(currentValue) > 0 && !!acquisitionDate && annualGrowthRate !== '';
  const growthRate = parseFloat(annualGrowthRate) || 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">
            {editAsset ? t('assets.editAsset') : t('assets.addAsset')}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>{t('assets.assetType')}</InputLabel>
          <Select
            value={type}
            label={t('assets.assetType')}
            onChange={(e) => setType(e.target.value as AssetType)}
          >
            {ASSET_TYPE_KEYS.map((v) => (
              <MenuItem key={v} value={v}>
                {t(`assetType.${v}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t('common.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />

        <TextField
          label={t('assets.currentValue', { currency })}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          type="number"
          fullWidth
          size="small"
        />

        <TextField
          label={t('assets.acquisitionDate')}
          value={acquisitionDate}
          onChange={(e) => setAcquisitionDate(e.target.value)}
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box>
          <TextField
            label={t('assets.growthRate')}
            value={annualGrowthRate}
            onChange={(e) => setAnnualGrowthRate(e.target.value)}
            type="number"
            fullWidth
            size="small"
            helperText={
              growthRate > 0
                ? t('assets.appreciates', { rate: growthRate })
                : growthRate < 0
                  ? t('assets.depreciates', { rate: Math.abs(growthRate) })
                  : t('assets.noChange')
            }
          />
        </Box>

        <Divider />

        {/* ── Financial source ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6">{t('assets.sourceTitle')}</Typography>

          <FormControl fullWidth size="small">
            <InputLabel>{t('assets.sourceLabel')}</InputLabel>
            <Select
              value={sourceType}
              label={t('assets.sourceLabel')}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
            >
              {SOURCE_TYPES.map((v) => (
                <MenuItem key={v} value={v}>
                  {t(`assets.source.${v}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {sourceType === 'none' && (
            <Alert severity="warning" sx={{ fontSize: 13 }}>
              {t('assets.sourceWarning')}
            </Alert>
          )}

          {sourceType === 'revenue' && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>{t('assets.sourceRevenuePick')}</InputLabel>
                <Select
                  value={sourceRevenueId}
                  label={t('assets.sourceRevenuePick')}
                  onChange={(e) => setSourceRevenueId(e.target.value)}
                >
                  {revenues.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ fontSize: 13 }}>
                {t('assets.sourceRevenueHint')}
              </Alert>
            </>
          )}

          {sourceType === 'expense' && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>{t('assets.sourceExpensePick')}</InputLabel>
                <Select
                  value={sourceExpenseId}
                  label={t('assets.sourceExpensePick')}
                  onChange={(e) => setSourceExpenseId(e.target.value)}
                >
                  {cashExpenses.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ fontSize: 13 }}>
                {t('assets.sourceExpenseHint')}
              </Alert>
            </>
          )}

          {sourceType === 'loan' && (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              {t('assets.sourceLoanInfo')}
            </Alert>
          )}
        </Box>

        {error && (
          <Typography color="error.main" variant="body2">
            {error}
          </Typography>
        )}

        <Button variant="contained" onClick={handleSave} disabled={saving || !canSave} fullWidth>
          {saving ? (
            <CircularProgress size={20} />
          ) : editAsset ? (
            t('common.save')
          ) : (
            t('assets.addAsset')
          )}
        </Button>
      </Box>
    </Drawer>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

interface AssetsTabProps {
  budgetId: string;
  budget: Budget;
}

export function AssetsTab({ budgetId, budget }: AssetsTabProps) {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const [chartStart, setChartStart] = useState(() => budget.startDate.slice(0, 7));
  const [chartEnd, setChartEnd] = useState(() => budget.endDate.slice(0, 7));
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('yearly');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, revList, expList] = await Promise.all([
        apiFetch(`/api/budgets/${budgetId}/assets`) as Promise<Asset[]>,
        apiFetch(`/api/budgets/${budgetId}/revenues`) as Promise<Revenue[]>,
        apiFetch(`/api/budgets/${budgetId}/expenses`) as Promise<Expense[]>,
      ]);
      setAssets(list);
      setRevenues(revList);
      setExpenses(expList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditAsset(null);
    setDrawerOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditAsset(asset);
    setDrawerOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}/assets/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await loadData();
      setSnack(t('assets.deleted'));
    } catch (e) {
      setSnack(t('errors.saveFailed', { message: (e as Error).message }));
    } finally {
      setDeleting(false);
    }
  }

  const chartData = useMemo(
    () => computeChartData(assets, budget.startDate, budget.endDate),
    [assets, budget.startDate, budget.endDate]
  );

  const displayChart = useMemo(() => {
    const filtered = chartData.labels
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => l >= chartStart && l <= chartEnd);
    if (chartGranularity === 'monthly') {
      const seriesData: Record<string, number[]> = {};
      for (const k of Object.keys(chartData.seriesData)) {
        seriesData[k] = filtered.map(({ i }) => chartData.seriesData[k][i]);
      }
      return {
        labels: filtered.map(({ l }) => l),
        seriesData,
        total: filtered.map(({ i }) => chartData.total[i]),
      };
    }
    const byYear: Record<string, Record<string, number> & { _total: number }> = {};
    filtered.forEach(({ l, i }) => {
      const yr = l.slice(0, 4);
      if (!byYear[yr]) {
        byYear[yr] = { _total: 0 };
        for (const k of Object.keys(chartData.seriesData)) byYear[yr][k] = 0;
      }
      for (const k of Object.keys(chartData.seriesData))
        byYear[yr][k] = chartData.seriesData[k][i] ?? 0;
      byYear[yr]._total = chartData.total[i];
    });
    const years = Object.keys(byYear).sort();
    const seriesData: Record<string, number[]> = {};
    for (const k of Object.keys(chartData.seriesData)) {
      seriesData[k] = years.map((yr) => byYear[yr][k] ?? 0);
    }
    return { labels: years, seriesData, total: years.map((yr) => byYear[yr]._total) };
  }, [chartData, chartStart, chartEnd, chartGranularity]);

  const chartSeries = useMemo(
    () => [
      ...assets.map((a) => ({
        data: displayChart.seriesData[a.id] ?? [],
        label: a.name,
        color: ASSET_TYPE_COLORS[a.type],
      })),
      { data: displayChart.total, label: t('assets.totalValue'), color: '#ffffff' },
    ],
    [assets, displayChart, t]
  );

  const tickInterval = Math.max(1, Math.floor(displayChart.labels.length / 8));

  const today = new Date();
  const endDate = new Date(budget.endDate);

  const columns: GridColDef<Asset>[] = useMemo(
    () => [
      { field: 'name', headerName: t('common.name'), flex: 1, minWidth: 140 },
      {
        field: 'type',
        headerName: t('common.type'),
        width: 130,
        renderCell: ({ value }) => (
          <Chip
            label={t(`assetType.${value as AssetType}`)}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: ASSET_TYPE_COLORS[value as AssetType] + '22',
              color: ASSET_TYPE_COLORS[value as AssetType],
            }}
          />
        ),
      },
      {
        field: 'currentValue',
        headerName: t('assets.purchaseValue'),
        width: 140,
        type: 'number',
        valueFormatter: (v: number) =>
          v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      },
      {
        field: 'acquisitionDate',
        headerName: t('assets.acquired'),
        width: 110,
        valueFormatter: (v: string) =>
          new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
      },
      {
        field: 'annualGrowthRate',
        headerName: t('assets.growth'),
        width: 100,
        type: 'number',
        renderCell: ({ value }) => (
          <Typography
            variant="body2"
            sx={{
              color: value > 0 ? 'success.main' : value < 0 ? 'error.main' : 'text.secondary',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value > 0 ? '+' : ''}
            {value}%
          </Typography>
        ),
      },
      {
        field: '_valueToday',
        headerName: t('assets.valueToday'),
        width: 130,
        type: 'number',
        valueGetter: (_v: unknown, row: Asset) => Math.round(assetValueAt(row, today)),
        valueFormatter: (v: number) =>
          v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        renderCell: ({ value }) => (
          <Typography
            variant="body2"
            sx={{ color: 'success.main', fontVariantNumeric: 'tabular-nums' }}
          >
            {(value as number).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Typography>
        ),
      },
      {
        field: '_valueAtEnd',
        headerName: t('assets.valueAt', { year: endDate.getFullYear() }),
        width: 130,
        type: 'number',
        valueGetter: (_v: unknown, row: Asset) => Math.round(assetValueAt(row, endDate)),
        valueFormatter: (v: number) =>
          v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      },
      {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => openEdit(row)} title={t('common.edit')}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(row)}
              title={t('common.delete')}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [endDate.getFullYear(), t] // eslint-disable-line
  );

  const totalToday = useMemo(
    () => assets.reduce((sum, a) => sum + assetValueAt(a, today), 0),
    [assets] // eslint-disable-line
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {/* ── Summary + Add ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: '16px 20px',
            minWidth: 160,
            flex: 1,
          }}
        >
          <Typography variant="overline" color="text.secondary">
            {t('assets.totalToday')}
          </Typography>
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 600,
              color: 'success.main',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(totalToday).toLocaleString()} {budget.currency}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('assets.count', { count: assets.length })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ mt: 1, alignSelf: 'flex-start' }}
        >
          {t('assets.addAsset')}
        </Button>
      </Box>

      {/* ── Chart ── */}
      {assets.length > 0 && chartData.labels.length > 0 && (
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
            <Typography variant="h6">{t('assets.chartTitle')}</Typography>
          </Box>
          <LineChart
            height={260}
            series={chartSeries}
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

      {/* ── DataGrid ── */}
      {assets.length === 0 ? (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            py: 8,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary" variant="body2">
            {t('common.noDataYet')}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <DataGrid
            rows={assets}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Box>
      )}

      {/* ── Drawer ── */}
      <AssetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        budgetId={budgetId}
        currency={budget.currency}
        editAsset={editAsset}
        revenues={revenues}
        expenses={expenses}
        onSaved={() => {
          loadData();
          setSnack(editAsset ? t('assets.updated') : t('assets.added'));
        }}
      />

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('assets.deleteAsset')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('assets.deleteAsset')} <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="text" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t('common.delete')}
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
