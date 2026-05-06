import { Box, Slider, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type ChartGranularity = 'monthly' | 'yearly';

interface Props {
  minMonth: string;
  maxMonth: string;
  startMonth: string;
  endMonth: string;
  granularity: ChartGranularity;
  onRangeChange: (start: string, end: string) => void;
  onGranularityChange: (g: ChartGranularity) => void;
}

function toMonthNum(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

function fromMonthNum(n: number): string {
  const y = Math.floor(n / 12);
  const m = (n % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function ChartRangeBrush({
  minMonth,
  maxMonth,
  startMonth,
  endMonth,
  granularity,
  onRangeChange,
  onGranularityChange,
}: Props) {
  const { t } = useTranslation();
  const minNum = toMonthNum(minMonth);
  const maxNum = toMonthNum(maxMonth);
  const startNum = toMonthNum(startMonth);
  const endNum = toMonthNum(endMonth);

  return (
    <Box sx={{ px: 3, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={granularity}
          exclusive
          onChange={(_, v) => v && onGranularityChange(v as ChartGranularity)}
          size="small"
        >
          <ToggleButton value="monthly" sx={{ px: 1.5, py: 0.25, fontSize: 12 }}>
            {t('granularity.monthly')}
          </ToggleButton>
          <ToggleButton value="yearly" sx={{ px: 1.5, py: 0.25, fontSize: 12 }}>
            {t('granularity.yearly')}
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        <TextField
          type="month"
          size="small"
          label={t('common.from')}
          value={startMonth}
          onChange={(e) => e.target.value && onRangeChange(e.target.value, endMonth)}
          slotProps={{ htmlInput: { min: minMonth, max: endMonth } }}
          sx={{ width: 160 }}
        />
        <TextField
          type="month"
          size="small"
          label={t('common.to')}
          value={endMonth}
          onChange={(e) => e.target.value && onRangeChange(startMonth, e.target.value)}
          slotProps={{ htmlInput: { min: startMonth, max: maxMonth } }}
          sx={{ width: 160 }}
        />
      </Box>
      <Box sx={{ px: 1 }}>
        <Slider
          value={[startNum, endNum]}
          min={minNum}
          max={maxNum}
          onChange={(_, v) => {
            const [s, e] = v as [number, number];
            onRangeChange(fromMonthNum(s), fromMonthNum(e));
          }}
          disableSwap
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
          <Typography variant="caption" color="text.disabled">
            {minMonth}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {maxMonth}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
