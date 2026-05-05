import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useBudget } from '@/contexts/BudgetContext';
import { ChartRangeBrush } from '@/components/charts/ChartRangeBrush';
import type { ChartGranularity } from '@/components/charts/ChartRangeBrush';

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
        sx={{ display: 'block', mb: 0.5, lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 600, color }}>{fmt(value, currency)}</Typography>
    </Box>
  );
}

function aggregatePtsYearly(pts: ProjectionPoint[]): ProjectionPoint[] {
  const byYear: Record<string, ProjectionPoint> = {};
  for (const pt of pts) {
    const yr = pt.date.slice(0, 4);
    if (!byYear[yr]) {
      byYear[yr] = { ...pt, date: `${yr}-01-01T00:00:00.000Z` };
    } else {
      // flows: sum; balances: take last
      byYear[yr].revenue += pt.revenue;
      byYear[yr].expense += pt.expense;
      byYear[yr].savingContribution += pt.savingContribution;
      byYear[yr].assetValue = pt.assetValue;
      byYear[yr].loanBalance = pt.loanBalance;
      byYear[yr].cashBalance = pt.cashBalance;
      byYear[yr].savingsBalance = pt.savingsBalance;
      byYear[yr].netWorth = pt.netWorth;
    }
  }
  return Object.keys(byYear)
    .sort()
    .map((yr) => byYear[yr]);
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { budget } = useBudget();
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [chartStart, setChartStart] = useState(() => budget?.startDate.slice(0, 7) ?? '');
  const [chartEnd, setChartEnd] = useState(() => budget?.endDate.slice(0, 7) ?? '');
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('monthly');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/budgets/${id}/projection`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProjection(d as ProjectionResponse))
      .finally(() => setLoading(false));
  }, [id]);

  const displayData = useMemo(() => {
    let pts = projection?.points ?? [];
    if (chartStart) pts = pts.filter((p) => p.date.slice(0, 7) >= chartStart);
    if (chartEnd) pts = pts.filter((p) => p.date.slice(0, 7) <= chartEnd);
    if (chartGranularity === 'yearly') pts = aggregatePtsYearly(pts);

    const formatLabel = (dateStr: string) =>
      chartGranularity === 'yearly'
        ? new Date(dateStr).getFullYear().toString()
        : new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

    return {
      labels: pts.map((p) => formatLabel(p.date)),
      netWorthSeries: pts.map((p) => p.netWorth),
      cashSeries: pts.map((p) => p.cashBalance),
      savingsSeries: pts.map((p) => p.savingsBalance),
      revenueSeries: pts.map((p) => p.revenue),
      expenseSeries: pts.map((p) => p.expense),
      count: pts.length,
    };
  }, [projection, chartStart, chartEnd, chartGranularity]);

  if (loading || !budget) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pts = projection?.points ?? [];
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  const monthlyRevenue = firstPt?.revenue ?? 0;
  const monthlyExpense = firstPt?.expense ?? 0;
  const netCashFlow = monthlyRevenue - monthlyExpense - (firstPt?.savingContribution ?? 0);
  const finalNetWorth = lastPt?.netWorth ?? 0;

  const tickInterval = Math.max(1, Math.floor(displayData.labels.length / 8));

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
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6">Net Worth Over Time</Typography>
        </Box>
        {displayData.count > 0 ? (
          <>
            <LineChart
              height={280}
              xAxis={[
                {
                  scaleType: 'band',
                  data: displayData.labels,
                  tickInterval: (_, i) => i % tickInterval === 0,
                },
              ]}
              series={[
                {
                  data: displayData.netWorthSeries,
                  label: 'Net Worth',
                  color: '#009688',
                  area: true,
                },
                { data: displayData.cashSeries, label: 'Cash', color: '#42a5f5' },
                { data: displayData.savingsSeries, label: 'Savings', color: '#66bb6a' },
              ]}
              margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
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
          </>
        ) : (
          <Box sx={{ p: 3, pt: 1 }}>
            <Typography color="text.secondary">No data yet.</Typography>
          </Box>
        )}
      </Box>

      {/* Cash Flow bar chart */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6">Monthly Cash Flow</Typography>
        </Box>
        {displayData.count > 0 ? (
          <>
            <BarChart
              height={260}
              xAxis={[
                {
                  scaleType: 'band',
                  data: displayData.labels,
                  tickInterval: (_, i) => i % tickInterval === 0,
                },
              ]}
              series={[
                { data: displayData.revenueSeries, label: 'Revenue', color: '#66bb6a' },
                { data: displayData.expenseSeries, label: 'Expenses', color: '#ef5350' },
              ]}
              margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
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
          </>
        ) : (
          <Box sx={{ p: 3, pt: 1 }}>
            <Typography color="text.secondary">No data yet.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
