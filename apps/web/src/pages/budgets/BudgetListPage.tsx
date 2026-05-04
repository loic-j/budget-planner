import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { signOut } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface Budget {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  startDate: string;
  endDate: string;
  initialSaving: number;
  ownerId: string;
}

const createSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    currency: z.string().min(1, 'Currency is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    initialSaving: z.number().min(0),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

type CreateForm = z.infer<typeof createSchema>;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  return `${fmt(start)} — ${fmt(end)}`;
}

export default function BudgetListPage() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'EUR',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
      initialSaving: 0,
    },
  });

  async function loadBudgets() {
    setLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/api/budgets')) as Budget[];
      setBudgets(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBudgets();
  }, []);

  async function onCreate(values: CreateForm) {
    setSaving(true);
    try {
      await apiFetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description || undefined,
          currency: values.currency,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          initialSaving: values.initialSaving,
        }),
      });
      setDialogOpen(false);
      reset();
      await loadBudgets();
    } catch (e) {
      setFormError('name', { message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  function openDialog() {
    reset();
    setDialogOpen(true);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
          Budget Planner
        </Typography>
        <Button variant="text" size="small" onClick={handleSignOut}>
          Sign out
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">My Budgets</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
            New budget
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error.main" sx={{ py: 4, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {!loading && !error && budgets.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 10,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h5" color="text.secondary">
              No budgets yet
            </Typography>
            <Typography color="text.disabled">
              Create your first budget to start planning your finances.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog} sx={{ mt: 1 }}>
              Create first budget
            </Button>
          </Box>
        )}

        {!loading && budgets.length > 0 && (
          <Grid container spacing={2}>
            {budgets.map((budget) => (
              <Grid item xs={12} sm={6} md={4} key={budget.id}>
                <Card
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <CardActionArea sx={{ p: 0 }}>
                    <CardContent>
                      <Typography variant="h5" noWrap gutterBottom>
                        {budget.name}
                      </Typography>
                      {budget.description && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1.5 }}>
                          {budget.description}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{
                            bgcolor: 'primary.main',
                            color: '#fff',
                            px: 1,
                            borderRadius: 0.5,
                            lineHeight: '20px',
                          }}
                        >
                          {budget.currency}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(budget.startDate, budget.endDate)}
                        </Typography>
                      </Box>
                      {budget.initialSaving > 0 && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}
                        >
                          Savings: {budget.initialSaving.toLocaleString()} {budget.currency}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          New Budget
        </DialogTitle>
        <form onSubmit={handleSubmit(onCreate)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Budget name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  autoFocus
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Description (optional)" fullWidth multiline rows={2} />
              )}
            />
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Currency"
                  fullWidth
                  error={!!errors.currency}
                  helperText={errors.currency?.message}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                  />
                )}
              />
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate?.message}
                  />
                )}
              />
            </Box>
            <Controller
              name="initialSaving"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange((e.target as HTMLInputElement).valueAsNumber)}
                  label="Initial savings"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  error={!!errors.initialSaving}
                  helperText={errors.initialSaving?.message ?? 'Starting savings balance'}
                />
              )}
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button variant="text" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
