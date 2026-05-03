import { RouterProvider } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { router } from './router';

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  colorSchemes: {
    dark: true,
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
