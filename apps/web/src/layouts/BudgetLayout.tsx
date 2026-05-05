import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SavingsIcon from '@mui/icons-material/Savings';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { signOut } from '@/lib/auth';
import { BudgetProvider, useBudget } from '@/contexts/BudgetContext';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 56;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: 'dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Projections', path: 'projections', icon: <TrendingUpIcon fontSize="small" /> },
  { label: 'Expenses', path: 'expenses', icon: <RemoveCircleOutlineIcon fontSize="small" /> },
  { label: 'Revenues', path: 'revenues', icon: <AddCircleOutlineIcon fontSize="small" /> },
  { label: 'Savings', path: 'savings', icon: <SavingsIcon fontSize="small" /> },
  { label: 'Assets', path: 'assets', icon: <BusinessCenterIcon fontSize="small" /> },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Members', path: 'members', icon: <PeopleIcon fontSize="small" /> },
  { label: 'Settings', path: 'settings', icon: <SettingsIcon fontSize="small" /> },
];

function SidebarNavItem({
  item,
  budgetId,
  collapsed,
}: {
  item: NavItem;
  budgetId: string;
  collapsed: boolean;
}) {
  return (
    <Tooltip title={collapsed ? item.label : ''} placement="right">
      <Box
        component={NavLink}
        to={`/budgets/${budgetId}/${item.path}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: collapsed ? 0 : '13px',
          py: 1,
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          textDecoration: 'none',
          color: 'text.secondary',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderLeft: '3px solid transparent',
          transition: 'background 0.15s, color 0.15s',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.05)',
            color: 'text.primary',
          },
          '&.active': {
            bgcolor: 'rgba(0,150,136,0.12)',
            color: 'primary.main',
            borderLeftColor: 'primary.main',
          },
        }}
      >
        {item.icon}
        {!collapsed && (
          <Typography variant="body2" fontWeight={500} noWrap>
            {item.label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { budget } = useBudget();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <>
      {/* Back + budget name */}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 56,
        }}
      >
        <Tooltip title="All budgets" placement="right">
          <IconButton size="small" onClick={() => navigate('/')} sx={{ flexShrink: 0 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!collapsed && (
          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
            {budget?.name ?? <Skeleton width={120} />}
          </Typography>
        )}
      </Box>

      {/* Main nav */}
      <Box sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            budgetId={budget?.id ?? ''}
            collapsed={collapsed}
          />
        ))}
      </Box>

      <Divider />

      {/* Bottom nav */}
      <Box sx={{ pt: 1, pb: 1 }}>
        {BOTTOM_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            budgetId={budget?.id ?? ''}
            collapsed={collapsed}
          />
        ))}
      </Box>

      <Divider />

      {/* User footer */}
      <Tooltip title={collapsed ? 'Sign out' : ''} placement="right">
        <Box
          onClick={handleSignOut}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: collapsed ? 0 : 2,
            py: 1.5,
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          <AccountCircleIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
          {!collapsed && (
            <Typography variant="caption" color="text.secondary" noWrap>
              Sign out
            </Typography>
          )}
        </Box>
      </Tooltip>
    </>
  );
}

function BudgetLayoutInner() {
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = useBudget();
  const w = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: w,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          zIndex: 100,
          boxShadow: 2,
        }}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse toggle */}
        <Box
          sx={{
            position: 'absolute',
            right: -12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 101,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setCollapsed((c) => !c)}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              width: 24,
              height: 24,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 14 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          ml: `${w}px`,
          transition: 'margin-left 0.2s ease',
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export function BudgetLayout() {
  return (
    <BudgetProvider>
      <BudgetLayoutInner />
    </BudgetProvider>
  );
}
