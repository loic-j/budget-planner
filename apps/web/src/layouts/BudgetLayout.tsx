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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import SavingsIcon from '@mui/icons-material/Savings';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useTranslation } from 'react-i18next';
import { signOut } from '@/lib/auth';
import { BudgetProvider, useBudget } from '@/contexts/BudgetContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const SIDEBAR_W = 220;
const SIDEBAR_COLLAPSED_W = 56;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_PATHS = [
  { key: 'nav.dashboard', path: 'dashboard', icon: <DashboardIcon fontSize="small" /> },
  { key: 'nav.expenses', path: 'expenses', icon: <RemoveCircleOutlineIcon fontSize="small" /> },
  { key: 'nav.revenues', path: 'revenues', icon: <AddCircleOutlineIcon fontSize="small" /> },
  { key: 'nav.savings', path: 'savings', icon: <SavingsIcon fontSize="small" /> },
  { key: 'nav.assets', path: 'assets', icon: <BusinessCenterIcon fontSize="small" /> },
];

const BOTTOM_NAV_PATHS = [
  { key: 'nav.members', path: 'members', icon: <PeopleIcon fontSize="small" /> },
  { key: 'nav.settings', path: 'settings', icon: <SettingsIcon fontSize="small" /> },
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
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {item.label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { budget } = useBudget();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems: NavItem[] = NAV_PATHS.map((p) => ({ ...p, label: t(p.key) }));
  const bottomItems: NavItem[] = BOTTOM_NAV_PATHS.map((p) => ({ ...p, label: t(p.key) }));

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
        <Tooltip title={t('nav.allBudgets')} placement="right">
          <IconButton size="small" onClick={() => navigate('/')} sx={{ flexShrink: 0 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!collapsed && (
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
            {budget?.name ?? <Skeleton width={120} />}
          </Typography>
        )}
      </Box>

      {/* Main nav */}
      <Box sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item) => (
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
        {bottomItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            budgetId={budget?.id ?? ''}
            collapsed={collapsed}
          />
        ))}
      </Box>

      <Divider />

      {/* Language switcher */}
      <LanguageSwitcher collapsed={collapsed} />

      <Divider />

      {/* User footer */}
      <Tooltip title={collapsed ? t('nav.signOut') : ''} placement="right">
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
              {t('nav.signOut')}
            </Typography>
          )}
        </Box>
      </Tooltip>

      <Divider />

      {/* Collapse / expand row */}
      <Tooltip title={collapsed ? t('nav.collapse') : ''} placement="right">
        <Box
          onClick={onToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: collapsed ? 0 : 2,
            py: 1.25,
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'text.disabled',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' },
          }}
        >
          {collapsed ? (
            <KeyboardDoubleArrowRightIcon fontSize="small" />
          ) : (
            <>
              <KeyboardDoubleArrowLeftIcon fontSize="small" />
              <Typography variant="caption">{t('nav.collapse')}</Typography>
            </>
          )}
        </Box>
      </Tooltip>
    </>
  );
}

function BudgetLayoutInner() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) return isSmall && stored === 'true';
    return isSmall;
  });
  const { loading } = useBudget();

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }
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
        <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
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
