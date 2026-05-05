import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
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

interface PersonAgePoint {
  personId: string;
  name: string;
  type: 'ADULT' | 'CHILD';
  ageByYear: Record<string, number | null>;
}

interface ProjectionResponse {
  points: ProjectionPoint[];
  persons: PersonAgePoint[];
}

function aggregatePtsYearly(pts: ProjectionPoint[]): ProjectionPoint[] {
  const byYear: Record<string, ProjectionPoint> = {};
  for (const pt of pts) {
    const yr = pt.date.slice(0, 4);
    if (!byYear[yr]) {
      byYear[yr] = { ...pt, date: `${yr}-01-01T00:00:00.000Z` };
    } else {
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

export default function ProjectionsPage() {
  const { id } = useParams<{ id: string }>();
  const { budget } = useBudget();
  const [granularity, setGranularity] = useState<ChartGranularity>('monthly');
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [chartStart, setChartStart] = useState(() => budget?.startDate.slice(0, 7) ?? '');
  const [chartEnd, setChartEnd] = useState(() => budget?.endDate.slice(0, 7) ?? '');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // always fetch monthly from API; we aggregate client-side
    fetch(`/api/budgets/${id}/projection?granularity=monthly`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProjection(d as ProjectionResponse))
      .finally(() => setLoading(false));
  }, [id]);

  const displayData = useMemo(() => {
    let pts = projection?.points ?? [];
    if (chartStart) pts = pts.filter((p) => p.date.slice(0, 7) >= chartStart);
    if (chartEnd) pts = pts.filter((p) => p.date.slice(0, 7) <= chartEnd);
    if (granularity === 'yearly') pts = aggregatePtsYearly(pts);

    const formatLabel = (dateStr: string) =>
      granularity === 'yearly'
        ? new Date(dateStr).getFullYear().toString()
        : new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

    return {
      labels: pts.map((p) => formatLabel(p.date)),
      netWorthSeries: pts.map((p) => p.netWorth),
      cashSeries: pts.map((p) => p.cashBalance),
      savingsSeries: pts.map((p) => p.savingsBalance),
      assetSeries: pts.map((p) => p.assetValue),
      count: pts.length,
    };
  }, [projection, chartStart, chartEnd, granularity]);

  const persons = projection?.persons ?? [];

  const tickInterval = Math.max(1, Math.floor(displayData.labels.length / 8));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Projections
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Net Worth breakdown */}
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
              <Typography variant="h6">Net Worth Breakdown</Typography>
            </Box>
            {displayData.count > 0 ? (
              <>
                <LineChart
                  height={320}
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
                    { data: displayData.cashSeries, label: 'Cash Balance', color: '#42a5f5' },
                    { data: displayData.savingsSeries, label: 'Savings', color: '#66bb6a' },
                    { data: displayData.assetSeries, label: 'Assets', color: '#ffa726' },
                  ]}
                  margin={{ top: 10, right: 20, bottom: 40, left: 80 }}
                />
                <ChartRangeBrush
                  minMonth={budget?.startDate.slice(0, 7) ?? chartStart}
                  maxMonth={budget?.endDate.slice(0, 7) ?? chartEnd}
                  startMonth={chartStart}
                  endMonth={chartEnd}
                  granularity={granularity}
                  onRangeChange={(s, e) => {
                    setChartStart(s);
                    setChartEnd(e);
                  }}
                  onGranularityChange={setGranularity}
                />
              </>
            ) : (
              <Box sx={{ p: 3, pt: 1 }}>
                <Typography color="text.secondary">No projection data.</Typography>
              </Box>
            )}
          </Box>

          {/* Per-person age table */}
          {persons.length > 0 && (
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
                Person Ages by Year
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box
                  component="table"
                  sx={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}
                >
                  <thead>
                    <tr>
                      <Box
                        component="th"
                        sx={{
                          textAlign: 'left',
                          p: '8px 12px',
                          color: 'text.secondary',
                          fontWeight: 600,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: '#2a2a2a',
                        }}
                      >
                        Person
                      </Box>
                      {Object.keys(persons[0]?.ageByYear ?? {}).map((yr) => (
                        <Box
                          component="th"
                          key={yr}
                          sx={{
                            textAlign: 'center',
                            p: '8px 12px',
                            color: 'text.secondary',
                            fontWeight: 600,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#2a2a2a',
                          }}
                        >
                          {yr}
                        </Box>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((p) => (
                      <tr key={p.personId}>
                        <Box
                          component="td"
                          sx={{
                            p: '8px 12px',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            fontWeight: 500,
                          }}
                        >
                          {p.name}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1, textTransform: 'lowercase' }}
                          >
                            {p.type}
                          </Typography>
                        </Box>
                        {Object.values(p.ageByYear).map((age, i) => (
                          <Box
                            component="td"
                            key={i}
                            sx={{
                              textAlign: 'center',
                              p: '8px 12px',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              color: age === null ? 'text.disabled' : 'text.primary',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {age === null ? '—' : age}
                          </Box>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
