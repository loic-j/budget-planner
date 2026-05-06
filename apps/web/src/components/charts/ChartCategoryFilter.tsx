import { Box, Chip, Collapse, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
}

interface Props {
  label?: string;
  unassignedLabel?: string;
  categories: Category[];
  selected: Set<string>;
  hasUncategorized: boolean;
  onChange: (s: Set<string>) => void;
}

export function ChartCategoryFilter({
  label = 'Categories',
  unassignedLabel = 'Uncategorized',
  categories,
  selected,
  hasUncategorized,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  if (categories.length === 0 && !hasUncategorized) return null;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 3,
          py: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
        }}
      >
        <FilterListIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {label}
        </Typography>
        {!open && selected.size > 0 && (
          <Chip
            label={`${selected.size} active`}
            size="small"
            color="primary"
            sx={{ height: 18, fontSize: 10, ml: 0.25 }}
          />
        )}
        <Box sx={{ flex: 1 }} />
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        )}
      </Box>

      <Collapse in={open}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', px: 3, pt: 0.5, pb: 1.5 }}>
          <Chip
            label="All"
            size="small"
            variant={selected.size === 0 ? 'filled' : 'outlined'}
            color={selected.size === 0 ? 'primary' : 'default'}
            onClick={() => onChange(new Set())}
            sx={{ height: 22, fontSize: 11 }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              size="small"
              variant={selected.has(cat.id) ? 'filled' : 'outlined'}
              color={selected.has(cat.id) ? 'primary' : 'default'}
              onClick={() => toggle(cat.id)}
              sx={{ height: 22, fontSize: 11 }}
            />
          ))}
          {hasUncategorized && (
            <Chip
              label={unassignedLabel}
              size="small"
              variant={selected.has('') ? 'filled' : 'outlined'}
              color={selected.has('') ? 'primary' : 'default'}
              onClick={() => toggle('')}
              sx={{ height: 22, fontSize: 11 }}
            />
          )}
        </Box>
      </Collapse>
    </>
  );
}
