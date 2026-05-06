import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'ja', label: 'JA', title: '日本語' },
  { code: 'fr', label: 'FR', title: 'Français' },
];

export function LanguageSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.language.slice(0, 2);

  function change(lang: string) {
    i18n.changeLanguage(lang);
  }

  if (collapsed) {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, py: 0.5 }}
      >
        {LANGS.map((l) => (
          <Tooltip key={l.code} title={l.title} placement="right">
            <Box
              onClick={() => change(l.code)}
              sx={{
                fontSize: 10,
                fontWeight: current === l.code ? 700 : 400,
                color: current === l.code ? 'primary.main' : 'text.disabled',
                cursor: 'pointer',
                lineHeight: 1.6,
                '&:hover': { color: 'text.secondary' },
              }}
            >
              {l.label}
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 0.75 }}>
      <ToggleButtonGroup
        value={current}
        exclusive
        onChange={(_, v) => v && change(v)}
        size="small"
        fullWidth
      >
        {LANGS.map((l) => (
          <Tooltip key={l.code} title={l.title}>
            <ToggleButton
              value={l.code}
              sx={{ fontSize: 11, py: 0.25, fontWeight: current === l.code ? 700 : 400 }}
            >
              {l.label}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
