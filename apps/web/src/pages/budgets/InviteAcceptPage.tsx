import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

interface InvitePreview {
  budgetName: string;
  role: 'EDITOR' | 'VIEWER';
  isValid: boolean;
}

type State =
  | { phase: 'loading' }
  | { phase: 'preview'; preview: InvitePreview }
  | { phase: 'invalid'; reason: string }
  | { phase: 'accepting' }
  | { phase: 'success'; budgetId: string }
  | { phase: 'error'; message: string };

export default function InviteAcceptPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!token) return;
    apiFetch(`/api/invite/${token}`)
      .then((data: unknown) => {
        const preview = data as InvitePreview;
        if (!preview.isValid) {
          setState({ phase: 'invalid', reason: t('invite.expiredReason') });
        } else {
          setState({ phase: 'preview', preview });
        }
      })
      .catch((e: Error) => {
        const msg = e.message.toLowerCase();
        if (msg.includes('404') || msg.includes('not found')) {
          setState({ phase: 'invalid', reason: t('invite.invalidReason') });
        } else {
          setState({ phase: 'error', message: e.message });
        }
      });
  }, [token, t]);

  async function handleAccept() {
    if (!token) return;
    setState({ phase: 'accepting' });
    try {
      const member = (await apiFetch(`/api/invite/${token}`, { method: 'POST' })) as {
        budgetId: string;
      };
      setState({ phase: 'success', budgetId: member.budgetId });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        navigate(`/login?redirect=/invite/${token}`);
        return;
      }
      setState({
        phase: 'error',
        message: msg.toLowerCase().includes('already a member') ? t('invite.alreadyMember') : msg,
      });
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: '12px',
          boxShadow: 3,
          p: '40px 40px 32px',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

        {state.phase === 'loading' && (
          <>
            <Typography variant="h4" gutterBottom>
              {t('common.loading')}
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </>
        )}

        {state.phase === 'preview' && (
          <>
            <Typography variant="h4" gutterBottom>
              {t('invite.invited')}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('invite.join')}{' '}
              <strong style={{ color: 'rgba(255,255,255,0.87)' }}>
                {state.preview.budgetName}
              </strong>{' '}
              {t('invite.as')}{' '}
              <strong style={{ color: 'rgba(255,255,255,0.87)' }}>{state.preview.role}</strong>
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={handleAccept}>
              {t('invite.accept')}
            </Button>
            <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/')}>
              {t('invite.decline')}
            </Button>
          </>
        )}

        {state.phase === 'accepting' && (
          <>
            <Typography variant="h4" gutterBottom>
              {t('invite.joining')}
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </>
        )}

        {state.phase === 'success' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" gutterBottom>
              {t('invite.success')}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('invite.successDesc')}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate(`/budgets/${state.budgetId}`)}
            >
              {t('invite.openBudget')}
            </Button>
          </>
        )}

        {(state.phase === 'invalid' || state.phase === 'error') && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" gutterBottom>
              {state.phase === 'invalid' ? t('invite.linkUnavailable') : t('invite.errorTitle')}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {state.phase === 'invalid' ? state.reason : state.message}
            </Typography>
            <Button variant="contained" fullWidth onClick={() => navigate('/')}>
              {t('invite.goToBudgets')}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
