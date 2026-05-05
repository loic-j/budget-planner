import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useBudget } from '@/contexts/BudgetContext';

interface BudgetFormState {
  name: string;
  startDate: string;
  endDate: string;
  initialSaving: string;
}

interface Person {
  id: string;
  name: string;
  type: 'ADULT' | 'CHILD';
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string | null;
  plannedDob: string | null;
}

interface PersonForm {
  name: string;
  type: 'ADULT' | 'CHILD';
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  plannedDob: string;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function SettingsPage() {
  const { id: budgetId } = useParams<{ id: string }>();
  const { budget, reload } = useBudget();
  const [form, setForm] = useState<BudgetFormState>({
    name: '',
    startDate: '',
    endDate: '',
    initialSaving: '',
  });
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const [persons, setPersons] = useState<Person[]>([]);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personForm, setPersonForm] = useState<PersonForm>({
    name: '',
    type: 'ADULT',
    sex: 'MALE',
    dob: '',
    plannedDob: '',
  });
  const [personSaving, setPersonSaving] = useState(false);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);

  useEffect(() => {
    if (budget) {
      setForm({
        name: budget.name,
        startDate: toDateInput(budget.startDate),
        endDate: toDateInput(budget.endDate),
        initialSaving: String(budget.initialSaving),
      });
    }
  }, [budget]);

  const loadPersons = useCallback(async () => {
    if (!budgetId) return;
    const list = (await apiFetch(`/api/budgets/${budgetId}/persons`)) as Person[];
    setPersons(list);
  }, [budgetId]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  async function handleSaveBudget() {
    if (!budgetId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          initialSaving: parseFloat(form.initialSaving),
        }),
      });
      reload();
      setSnack('Budget saved');
    } catch (e: unknown) {
      setSnack((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function openPersonDialog(person?: Person) {
    if (person) {
      setEditingPerson(person);
      setPersonForm({
        name: person.name,
        type: person.type,
        sex: person.sex,
        dob: toDateInput(person.dob),
        plannedDob: toDateInput(person.plannedDob),
      });
    } else {
      setEditingPerson(null);
      setPersonForm({ name: '', type: 'ADULT', sex: 'MALE', dob: '', plannedDob: '' });
    }
    setPersonDialogOpen(true);
  }

  async function handleSavePerson() {
    if (!budgetId) return;
    setPersonSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: personForm.name,
        type: personForm.type,
        sex: personForm.sex,
      };
      if (personForm.type === 'ADULT') {
        payload.dob = new Date(personForm.dob).toISOString();
      } else if (personForm.dob) {
        payload.dob = new Date(personForm.dob).toISOString();
      } else if (personForm.plannedDob) {
        payload.plannedDob = new Date(personForm.plannedDob).toISOString();
      }

      if (editingPerson) {
        await apiFetch(`/api/budgets/${budgetId}/persons/${editingPerson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/budgets/${budgetId}/persons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setPersonDialogOpen(false);
      await loadPersons();
    } catch (e: unknown) {
      setSnack((e as Error).message);
    } finally {
      setPersonSaving(false);
    }
  }

  async function handleDeletePerson() {
    if (!budgetId || !deletePersonId) return;
    try {
      await apiFetch(`/api/budgets/${budgetId}/persons/${deletePersonId}`, { method: 'DELETE' });
      setDeletePersonId(null);
      await loadPersons();
    } catch (e: unknown) {
      setSnack((e as Error).message);
    }
  }

  if (!budget) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      {/* Budget settings */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Budget settings
      </Typography>

      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <TextField
          label="Name"
          size="small"
          fullWidth
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Start date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </Box>
        <TextField
          label="Initial saving"
          type="number"
          size="small"
          fullWidth
          value={form.initialSaving}
          onChange={(e) => setForm((f) => ({ ...f, initialSaving: e.target.value }))}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSaveBudget} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* People */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">People</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => openPersonDialog()}
        >
          Add person
        </Button>
      </Box>

      {persons.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No people added yet. People can be linked to expenses, revenues, and savings.
        </Typography>
      ) : (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {persons.map((p, i) => (
            <Box key={p.id}>
              {i > 0 && <Divider />}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.type} · {p.sex}
                    {p.dob ? ` · Born ${new Date(p.dob).toLocaleDateString()}` : ''}
                    {p.plannedDob
                      ? ` · Planned ${new Date(p.plannedDob).toLocaleDateString()}`
                      : ''}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => openPersonDialog(p)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => setDeletePersonId(p.id)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Person dialog */}
      <Dialog
        open={personDialogOpen}
        onClose={() => setPersonDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {editingPerson ? 'Edit person' : 'Add person'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            size="small"
            fullWidth
            value={personForm.name}
            onChange={(e) => setPersonForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Select
              size="small"
              fullWidth
              value={personForm.type}
              onChange={(e) =>
                setPersonForm((f) => ({
                  ...f,
                  type: e.target.value as 'ADULT' | 'CHILD',
                  dob: '',
                  plannedDob: '',
                }))
              }
            >
              <MenuItem value="ADULT">Adult</MenuItem>
              <MenuItem value="CHILD">Child</MenuItem>
            </Select>
            <Select
              size="small"
              fullWidth
              value={personForm.sex}
              onChange={(e) =>
                setPersonForm((f) => ({ ...f, sex: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' }))
              }
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </Box>

          {personForm.type === 'ADULT' && (
            <TextField
              label="Date of birth"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={personForm.dob}
              onChange={(e) => setPersonForm((f) => ({ ...f, dob: e.target.value }))}
            />
          )}

          {personForm.type === 'CHILD' && (
            <>
              <TextField
                label="Date of birth (if born)"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={personForm.dob}
                onChange={(e) =>
                  setPersonForm((f) => ({ ...f, dob: e.target.value, plannedDob: '' }))
                }
              />
              <TextField
                label="Planned date of birth (if not yet born)"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={personForm.plannedDob}
                onChange={(e) =>
                  setPersonForm((f) => ({ ...f, plannedDob: e.target.value, dob: '' }))
                }
              />
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="text" onClick={() => setPersonDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSavePerson} disabled={personSaving}>
            {personSaving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete person confirm */}
      <Dialog open={!!deletePersonId} onClose={() => setDeletePersonId(null)} maxWidth="xs">
        <DialogTitle>Delete person?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This will remove the person from the budget.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="text" onClick={() => setDeletePersonId(null)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeletePerson}>
            Delete
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
