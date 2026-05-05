import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useBudget } from '@/contexts/BudgetContext';
import { AssetsTab } from './AssetsTab.js';

export default function AssetsPage() {
  const { id } = useParams<{ id: string }>();
  const { budget } = useBudget();
  if (!id || !budget) return null;
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <AssetsTab budgetId={id} budget={budget} />
    </Box>
  );
}
