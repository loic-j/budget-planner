import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const EmailVerificationPage = lazy(() => import('@/pages/auth/EmailVerificationPage'));
const InviteAcceptPage = lazy(() => import('@/pages/budgets/InviteAcceptPage'));
const BudgetListPage = lazy(() => import('@/pages/budgets/BudgetListPage'));
const BudgetDetailPage = lazy(() => import('@/pages/budgets/BudgetDetailPage'));

function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/register', element: withSuspense(<RegisterPage />) },
  { path: '/verify-email', element: withSuspense(<EmailVerificationPage />) },
  { path: '/invite/:token', element: withSuspense(<InviteAcceptPage />) },
  {
    path: '/',
    element: <AuthGuard>{withSuspense(<BudgetListPage />)}</AuthGuard>,
  },
  {
    path: '/budgets/:id',
    element: <AuthGuard>{withSuspense(<BudgetDetailPage />)}</AuthGuard>,
  },
]);
