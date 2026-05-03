import { RouterProvider } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { Shadows } from '@mui/material/styles';
import { router } from './router';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#009688', light: '#4db6ac', dark: '#00796b' },
    success: { main: '#66bb6a' },
    error: { main: '#ef5350' },
    warning: { main: '#ffa726' },
    info: { main: '#42a5f5' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: {
      primary: 'rgba(255,255,255,0.87)',
      secondary: 'rgba(255,255,255,0.6)',
      disabled: 'rgba(255,255,255,0.38)',
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontSize: '28px', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '22px', fontWeight: 600 },
    h4: { fontSize: '18px', fontWeight: 600 },
    h5: { fontSize: '16px', fontWeight: 600 },
    h6: { fontSize: '14px', fontWeight: 600 },
    body1: { fontSize: '16px' },
    body2: { fontSize: '14px' },
    caption: { fontSize: '12px' },
    overline: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' },
  },
  shape: { borderRadius: 4 },
  shadows: [
    'none',
    '0 2px 8px rgba(0,0,0,0.6)',
    '0 4px 16px rgba(0,0,0,0.7)',
    '0 8px 32px rgba(0,0,0,0.8)',
    ...Array(21).fill('none'),
  ] as Shadows,
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
