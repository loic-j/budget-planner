import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useBudget } from '@/contexts/BudgetContext';

interface ProjectionPoint {
  date: string;
  revenue: number;
  expense: number;
  savingContribution: number;
  assetValue: number;
  loanBalance: number;
  cashBalance: number;
  savingsBalance: number;
  netWorth: number;
}

interface ProjectionResponse {
  points: ProjectionPoint[];
}

function fmt(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
  currency,
  positive,
}: {
  label: string;
  value: number;
  currency: string;
  positive?: boolean;
}) {
  const color =
    positive === undefined ? 'text.primary' : value >= 0 ? 'success.main' : 'error.main';
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: '20px 24px',
        flex: 1,
        minWidth: 160,
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5, lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 600, color }}>{fmt(value, currency)}</Typography>
    </Box>
  );
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { budget } = useBudget();
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/budgets/${id}/projection`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProjection(d as ProjectionResponse))
      .finally(() => setLoading(false));
  }, [id]);

  const { labels, netWorthSeries, cashSeries, savingsSeries, revenueSeries, expenseSeries } =
    useMemo(() => {
      const pts = projection?.points ?? [];
      return {
        labels: pts.map((p) =>
          new Date(p.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
        ),
        netWorthSeries: pts.map((p) => p.netWorth),
        cashSeries: pts.map((p) => p.cashBalance),
        savingsSeries: pts.map((p) => p.savingsBalance),
        revenueSeries: pts.map((p) => p.revenue),
        expenseSeries: pts.map((p) => p.expense),
      };
    }, [projection]);

  if (loading || !budget) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pts = projection?.points ?? [];
  const lastPt = pts[pts.length - 1];
  const firstPt = pts[0];
  const monthlyRevenue = firstPt?.revenue ?? 0;
  const monthlyExpense = firstPt?.expense ?? 0;
  const netCashFlow = monthlyRevenue - monthlyExpense - (firstPt?.savingContribution ?? 0);
  const finalNetWorth = lastPt?.netWorth ?? 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stat cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <StatCard label="Monthly Revenue" value={monthlyRevenue} currency={budget.currency} />
        <StatCard label="Monthly Expenses" value={monthlyExpense} currency={budget.currency} />
        <StatCard
          label="Net Cash Flow / mo"
          value={netCashFlow}
          currency={budget.currency}
          positive
        />
        <StatCard
          label="Final Net Worth"
          value={finalNetWorth}
          currency={budget.currency}
          positive
        />
      </Box>

      {/* Net Worth chart */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Net Worth Over Time
        </Typography>
        {pts.length > 0 ? (
          <LineChart
            height={280}
            xAxis={[{ scaleType: 'band', data: labels, tickInterval: (_, i) => i % 3 === 0 }]}
            series={[
              { data: netWorthSeries, label: 'Net Worth', color: '#009688', area: true },
              { data: cashSeries, label: 'Cash', color: '#42a5f5' },
              { data: savingsSeries, label: 'Savings', color: '#66bb6a' },
            ]}
            margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
          />
        ) : (
          <Typography color="text.secondary">No data yet.</Typography>
        )}
      </Box>

      {/* Cash Flow bar chart */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Monthly Cash Flow
        </Typography>
        {pts.length > 0 ? (
          <BarChart
            height={260}
            xAxis={[{ scaleType: 'band', data: labels, tickInterval: (_, i) => i % 3 === 0 }]}
            series={[
              { data: revenueSeries, label: 'Revenue', color: '#66bb6a' },
              { data: expenseSeries, label: 'Expenses', color: '#ef5350' },
            ]}
            margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
          />
        ) : (
          <Typography color="text.secondary">No data yet.</Typography>
        )}
      </Box>
    </Box>
  );
}
