import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BudgetLayout } from '@/layouts/BudgetLayout';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const EmailVerificationPage = lazy(() => import('@/pages/auth/EmailVerificationPage'));
const InviteAcceptPage = lazy(() => import('@/pages/budgets/InviteAcceptPage'));
const BudgetListPage = lazy(() => import('@/pages/budgets/BudgetListPage'));
const DashboardPage = lazy(() => import('@/pages/budgets/DashboardPage'));
const ProjectionsPage = lazy(() => import('@/pages/budgets/ProjectionsPage'));
const ExpensesPage = lazy(() => import('@/pages/budgets/ExpensesPage'));
const RevenuesPage = lazy(() => import('@/pages/budgets/RevenuesPage'));
const SavingsPage = lazy(() => import('@/pages/budgets/SavingsPage'));
const AssetsPage = lazy(() => import('@/pages/budgets/AssetsPage'));
const MembersPage = lazy(() => import('@/pages/budgets/MembersPage'));
const SettingsPage = lazy(() => import('@/pages/budgets/SettingsPage'));
const UserProfilePage = lazy(() => import('@/pages/profile/UserProfilePage'));

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
    path: '/profile',
    element: <AuthGuard>{withSuspense(<UserProfilePage />)}</AuthGuard>,
  },
  {
    path: '/budgets/:id',
    element: (
      <AuthGuard>
        <BudgetLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'projections', element: withSuspense(<ProjectionsPage />) },
      { path: 'expenses', element: withSuspense(<ExpensesPage />) },
      { path: 'revenues', element: withSuspense(<RevenuesPage />) },
      { path: 'savings', element: withSuspense(<SavingsPage />) },
      { path: 'assets', element: withSuspense(<AssetsPage />) },
      { path: 'members', element: withSuspense(<MembersPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
    ],
  },
]);
