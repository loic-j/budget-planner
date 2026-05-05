import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useBudget } from '@/contexts/BudgetContext';
import { SavingsTab } from './SavingsTab.js';

export default function SavingsPage() {
  const { id } = useParams<{ id: string }>();
  const { budget } = useBudget();
  if (!id || !budget) return null;
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <SavingsTab budgetId={id} budget={budget} />
    </Box>
  );
}
