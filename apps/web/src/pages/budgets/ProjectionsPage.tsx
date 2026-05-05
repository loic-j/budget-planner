import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
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

type Granularity = 'monthly' | 'yearly';

export default function ProjectionsPage() {
  const { id } = useParams<{ id: string }>();
  useBudget();
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/budgets/${id}/projection?granularity=${granularity}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProjection(d as ProjectionResponse))
      .finally(() => setLoading(false));
  }, [id, granularity]);

  const { labels, netWorthSeries, cashSeries, savingsSeries, assetSeries } = useMemo(() => {
    const pts = projection?.points ?? [];
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
    };
  }, [projection, granularity]);

  const persons = projection?.persons ?? [];
  const pts = projection?.points ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Projections</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Granularity</InputLabel>
          <Select
            label="Granularity"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
          >
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
              p: 3,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Net Worth Breakdown
            </Typography>
            {pts.length > 0 ? (
              <LineChart
                height={320}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: labels,
                    tickInterval: granularity === 'monthly' ? (_, i) => i % 3 === 0 : undefined,
                  },
                ]}
                series={[
                  { data: netWorthSeries, label: 'Net Worth', color: '#009688', area: true },
                  { data: cashSeries, label: 'Cash Balance', color: '#42a5f5' },
                  { data: savingsSeries, label: 'Savings', color: '#66bb6a' },
                  { data: assetSeries, label: 'Assets', color: '#ffa726' },
                ]}
                margin={{ top: 10, right: 20, bottom: 40, left: 80 }}
              />
            ) : (
              <Typography color="text.secondary">No projection data.</Typography>
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
