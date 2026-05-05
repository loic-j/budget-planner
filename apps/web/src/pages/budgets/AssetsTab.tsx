import { useEffect, useState, useCallback, useMemo } from 'react';
import {
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

interface Asset {
  id: string;
  budgetId: string;
  type: AssetType;
  name: string;
  currentValue: number;
  acquisitionDate: string;
  annualGrowthRate: number;
  loanDetailId: string | null;
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
  const factor = 1 + asset.annualGrowthRate / 100;
  if (factor <= 0) return 0;
  const years = (date.getTime() - new Date(asset.acquisitionDate).getTime()) / MS_PER_YEAR;
  return Math.max(0, asset.currentValue * Math.pow(factor, years));
}

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  REAL_ESTATE: '#009688',
  INVESTMENT: '#42a5f5',
  VEHICLE: '#ffa726',
  OTHER: '#90a4ae',
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  REAL_ESTATE: 'Real estate',
  INVESTMENT: 'Investment',
  VEHICLE: 'Vehicle',
  OTHER: 'Other',
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
  onSaved: () => void;
}

function AssetDrawer({ open, onClose, budgetId, currency, editAsset, onSaved }: DrawerProps) {
  const [type, setType] = useState<AssetType>('REAL_ESTATE');
  const [name, setName] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [annualGrowthRate, setAnnualGrowthRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editAsset) {
      setType(editAsset.type);
      setName(editAsset.name);
      setCurrentValue(String(editAsset.currentValue));
      setAcquisitionDate(editAsset.acquisitionDate.slice(0, 10));
      setAnnualGrowthRate(String(editAsset.annualGrowthRate));
    } else {
      setType('REAL_ESTATE');
      setName('');
      setCurrentValue('');
      setAcquisitionDate('');
      setAnnualGrowthRate('0');
    }
    setError('');
  }, [editAsset, open]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body = {
        type,
        name,
        currentValue: parseFloat(currentValue),
        acquisitionDate: new Date(acquisitionDate).toISOString(),
        annualGrowthRate: parseFloat(annualGrowthRate),
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

  const canSave = !!name && !!currentValue && !!acquisitionDate && annualGrowthRate !== '';
  const growthRate = parseFloat(annualGrowthRate) || 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{editAsset ? 'Edit asset' : 'Add asset'}</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={(e) => setType(e.target.value as AssetType)}>
            {(Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][]).map(([v, l]) => (
              <MenuItem key={v} value={v}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />

        <TextField
          label={`Current value (${currency})`}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          type="number"
          fullWidth
          size="small"
        />

        <TextField
          label="Acquisition date"
          value={acquisitionDate}
          onChange={(e) => setAcquisitionDate(e.target.value)}
          type="date"
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <Box>
          <TextField
            label="Annual growth rate (%)"
            value={annualGrowthRate}
            onChange={(e) => setAnnualGrowthRate(e.target.value)}
            type="number"
            fullWidth
            size="small"
            helperText={
              growthRate > 0
                ? `Appreciates ${growthRate}% / year`
                : growthRate < 0
                  ? `Depreciates ${Math.abs(growthRate)}% / year`
                  : 'No change in value'
            }
          />
        </Box>

        {error && (
          <Typography color="error.main" variant="body2">
            {error}
          </Typography>
        )}

        <Button variant="contained" onClick={handleSave} disabled={saving || !canSave} fullWidth>
          {saving ? <CircularProgress size={20} /> : editAsset ? 'Save changes' : 'Add asset'}
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = (await apiFetch(`/api/budgets/${budgetId}/assets`)) as Asset[];
      setAssets(list);
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
      setSnack('Asset deleted');
    } catch (e) {
      setSnack('Delete failed: ' + (e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const chartData = useMemo(
    () => computeChartData(assets, budget.startDate, budget.endDate),
    [assets, budget.startDate, budget.endDate]
  );

  const chartSeries = useMemo(
    () => [
      ...assets.map((a) => ({
        data: chartData.seriesData[a.id] ?? [],
        label: a.name,
        color: ASSET_TYPE_COLORS[a.type],
      })),
      { data: chartData.total, label: 'Total', color: '#ffffff' },
    ],
    [assets, chartData]
  );

  const tickInterval = Math.max(1, Math.floor(chartData.labels.length / 8));

  const today = new Date();
  const endDate = new Date(budget.endDate);

  const columns: GridColDef<Asset>[] = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
      {
        field: 'type',
        headerName: 'Type',
        width: 130,
        renderCell: ({ value }) => (
          <Chip
            label={ASSET_TYPE_LABELS[value as AssetType]}
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
        headerName: 'Purchase value',
        width: 140,
        type: 'number',
        valueFormatter: (v: number) =>
          v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      },
      {
        field: 'acquisitionDate',
        headerName: 'Acquired',
        width: 110,
        valueFormatter: (v: string) =>
          new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
      },
      {
        field: 'annualGrowthRate',
        headerName: 'Growth %',
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
        headerName: 'Value today',
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
        headerName: `Value ${endDate.getFullYear()}`,
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
            <IconButton size="small" onClick={() => openEdit(row)} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(row)}
              title="Delete"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [endDate.getFullYear()] // eslint-disable-line
  );

  // Summary
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
            Total assets today
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
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ mt: 1, alignSelf: 'flex-start' }}
        >
          Add asset
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
            <Typography variant="h6">Asset value projection</Typography>
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
            No assets yet. Click "Add asset" to get started.
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
        onSaved={() => {
          loadData();
          setSnack(editAsset ? 'Asset updated' : 'Asset added');
        }}
      />

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete asset</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="text" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
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
