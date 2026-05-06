import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

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

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  onPersonChange: () => void;
}

const EMPTY_FORM: PersonForm = { name: '', type: 'ADULT', sex: 'MALE', dob: '', plannedDob: '' };
const SEX_LABEL: Record<string, string> = { MALE: 'M', FEMALE: 'F', OTHER: '?' };

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

function toInputDate(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return `${years}y`;
}

function PersonFormFields({
  form,
  onChange,
}: {
  form: PersonForm;
  onChange: (f: PersonForm) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        autoFocus
        label="Name"
        size="small"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        fullWidth
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={form.type}
            label="Type"
            onChange={(e) =>
              onChange({
                ...form,
                type: e.target.value as PersonForm['type'],
                dob: '',
                plannedDob: '',
              })
            }
          >
            <MenuItem value="ADULT">Adult</MenuItem>
            <MenuItem value="CHILD">Child</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Sex</InputLabel>
          <Select
            value={form.sex}
            label="Sex"
            onChange={(e) => onChange({ ...form, sex: e.target.value as PersonForm['sex'] })}
          >
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TextField
        label={form.type === 'CHILD' ? 'Date of birth (if born)' : 'Date of birth'}
        type="date"
        size="small"
        value={form.dob}
        onChange={(e) => onChange({ ...form, dob: e.target.value })}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />
      {form.type === 'CHILD' && (
        <TextField
          label="Expected date (if planned)"
          type="date"
          size="small"
          value={form.plannedDob}
          onChange={(e) => onChange({ ...form, plannedDob: e.target.value })}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    </Box>
  );
}

function toApiBody(form: PersonForm) {
  return {
    name: form.name.trim(),
    type: form.type,
    sex: form.sex,
    ...(form.dob && { dob: new Date(form.dob).toISOString() }),
    ...(form.plannedDob && { plannedDob: new Date(form.plannedDob).toISOString() }),
  };
}

export function PersonManager({ open, onClose, budgetId, onPersonChange }: Props) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PersonForm>(EMPTY_FORM);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<PersonForm>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch(`/api/budgets/${budgetId}/persons`)
      .then((data) => setPersons(data as Person[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, budgetId]);

  function startEdit(p: Person) {
    setEditId(p.id);
    setEditForm({
      name: p.name,
      type: p.type,
      sex: p.sex,
      dob: toInputDate(p.dob),
      plannedDob: toInputDate(p.plannedDob),
    });
    setAddOpen(false);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleSaveEdit(p: Person) {
    if (!editForm.name.trim()) return;
    setBusyId(p.id);
    try {
      await apiFetch(`/api/budgets/${budgetId}/persons/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(editForm)),
      });
      const data = await apiFetch(`/api/budgets/${budgetId}/persons`);
      setPersons(data as Person[]);
      onPersonChange();
      setEditId(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/budgets/${budgetId}/persons/${id}`, { method: 'DELETE' });
      setPersons((prev) => prev.filter((p) => p.id !== id));
      onPersonChange();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd() {
    if (!addForm.name.trim()) return;
    setAddBusy(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiBody(addForm)),
      });
      const data = await apiFetch(`/api/budgets/${budgetId}/persons`);
      setPersons(data as Person[]);
      onPersonChange();
      setAddForm(EMPTY_FORM);
      setAddOpen(false);
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 340, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 56,
          }}
        >
          <Typography variant="h6">Persons</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : persons.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
              No persons yet
            </Typography>
          ) : (
            persons.map((p) => (
              <Box key={p.id}>
                {editId === p.id ? (
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      bgcolor: 'rgba(0,150,136,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <PersonFormFields form={editForm} onChange={setEditForm} />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" variant="text" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!editForm.name.trim() || busyId === p.id}
                        onClick={() => handleSaveEdit(p)}
                        startIcon={
                          busyId === p.id ? (
                            <CircularProgress size={12} />
                          ) : (
                            <CheckIcon sx={{ fontSize: 14 }} />
                          )
                        }
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover .person-actions': { opacity: 1 },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {p.name}
                        </Typography>
                        <Chip
                          label={p.type === 'ADULT' ? 'Adult' : 'Child'}
                          size="small"
                          color={p.type === 'ADULT' ? 'primary' : 'info'}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {SEX_LABEL[p.sex]}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {p.dob
                          ? `Born · ${calcAge(p.dob)}`
                          : p.plannedDob
                            ? `Expected ${new Date(p.plannedDob).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                            : ''}
                      </Typography>
                    </Box>
                    <Box
                      className="person-actions"
                      sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s' }}
                    >
                      <Tooltip title="Edit" placement="top">
                        <IconButton size="small" onClick={() => startEdit(p)}>
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" placement="top">
                        <IconButton
                          size="small"
                          disabled={busyId === p.id}
                          onClick={() => handleDelete(p.id)}
                          sx={{ '&:hover': { color: 'error.main' } }}
                        >
                          {busyId === p.id ? (
                            <CircularProgress size={14} />
                          ) : (
                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
                <Divider />
              </Box>
            ))
          )}
        </Box>

        {/* Add section */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {addOpen ? (
            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: 11, lineHeight: 1 }}
              >
                New person
              </Typography>
              <PersonFormFields form={addForm} onChange={setAddForm} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setAddOpen(false);
                    setAddForm(EMPTY_FORM);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!addForm.name.trim() || addBusy}
                  onClick={handleAdd}
                  startIcon={addBusy ? <CircularProgress size={12} /> : undefined}
                >
                  {addBusy ? 'Adding…' : 'Add'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Button
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setAddOpen(true);
                  setEditId(null);
                }}
                fullWidth
              >
                Add person
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
