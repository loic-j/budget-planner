import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';

interface Category {
  id: string;
  name: string;
}

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  budgetId: string;
  categoryType: 'EXPENSE' | 'REVENUE' | 'SAVING';
  categories: Category[];
  onCategoryChange: () => void;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export function CategoryManager({
  anchorEl,
  onClose,
  budgetId,
  categoryType,
  categories,
  onCategoryChange,
}: Props) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function handleRename(cat: Category) {
    if (!editName.trim() || editName.trim() === cat.name) {
      cancelEdit();
      return;
    }
    setBusyId(cat.id);
    try {
      await apiFetch(`/api/budgets/${budgetId}/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      onCategoryChange();
      cancelEdit();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/budgets/${budgetId}/categories/${id}`, { method: 'DELETE' });
      onCategoryChange();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setAddBusy(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: categoryType, name: newName.trim(), icon: 'other' }),
      });
      onCategoryChange();
      setNewName('');
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 260, mt: 0.5 } } }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: 11 }}>
          {t('categoryMgr.title')}
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {categories.length === 0 && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ px: 2, py: 2, textAlign: 'center' }}
          >
            {t('categoryMgr.noCategories')}
          </Typography>
        )}
        {categories.map((cat) => (
          <Box
            key={cat.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              minHeight: 38,
              gap: 0.5,
              '&:hover .cat-actions': { opacity: 1 },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
            }}
          >
            {editingId === cat.id ? (
              <>
                <TextField
                  autoFocus
                  size="small"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(cat);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  sx={{ flex: 1 }}
                  slotProps={{ htmlInput: { style: { fontSize: 13, padding: '4px 8px' } } }}
                />
                <IconButton
                  size="small"
                  color="primary"
                  disabled={busyId === cat.id}
                  onClick={() => handleRename(cat)}
                >
                  {busyId === cat.id ? (
                    <CircularProgress size={14} />
                  ) : (
                    <CheckIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                <IconButton size="small" onClick={cancelEdit}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ flex: 1, fontSize: 13 }} noWrap>
                  {cat.name}
                </Typography>
                <Box
                  className="cat-actions"
                  sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s' }}
                >
                  <Tooltip title={t('categoryMgr.rename')} placement="top">
                    <IconButton size="small" onClick={() => startEdit(cat)}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')} placement="top">
                    <IconButton
                      size="small"
                      disabled={busyId === cat.id}
                      onClick={() => handleDelete(cat.id)}
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      {busyId === cat.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Add new */}
      <Box sx={{ px: 1.5, py: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('categoryMgr.placeholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { style: { fontSize: 13, padding: '4px 8px' } } }}
        />
        <Tooltip title={t('common.add')} placement="top">
          <span>
            <IconButton
              size="small"
              color="primary"
              disabled={!newName.trim() || addBusy}
              onClick={handleAdd}
            >
              {addBusy ? <CircularProgress size={14} /> : <AddIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Popover>
  );
}
