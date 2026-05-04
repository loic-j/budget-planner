import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!token) return;
    apiFetch(`/api/invite/${token}`)
      .then((data: unknown) => {
        const preview = data as InvitePreview;
        if (!preview.isValid) {
          setState({
            phase: 'invalid',
            reason: 'This invite link has expired or reached its usage limit.',
          });
        } else {
          setState({ phase: 'preview', preview });
        }
      })
      .catch((e: Error) => {
        const msg = e.message.toLowerCase();
        if (msg.includes('404') || msg.includes('not found')) {
          setState({
            phase: 'invalid',
            reason: 'This invite link is invalid or has been revoked.',
          });
        } else {
          setState({ phase: 'error', message: e.message });
        }
      });
  }, [token]);

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
        message: msg.toLowerCase().includes('already a member')
          ? 'You are already a member of this budget.'
          : msg,
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
              Loading…
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </>
        )}

        {state.phase === 'preview' && (
          <>
            <Typography variant="h4" gutterBottom>
              You're invited!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Join{' '}
              <strong style={{ color: 'rgba(255,255,255,0.87)' }}>
                {state.preview.budgetName}
              </strong>{' '}
              as <strong style={{ color: 'rgba(255,255,255,0.87)' }}>{state.preview.role}</strong>
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={handleAccept}>
              Accept invitation
            </Button>
            <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/')}>
              Decline
            </Button>
          </>
        )}

        {state.phase === 'accepting' && (
          <>
            <Typography variant="h4" gutterBottom>
              Joining…
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </>
        )}

        {state.phase === 'success' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" gutterBottom>
              You're in!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You've joined the budget successfully.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate(`/budgets/${state.budgetId}`)}
            >
              Open budget
            </Button>
          </>
        )}

        {(state.phase === 'invalid' || state.phase === 'error') && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" gutterBottom>
              {state.phase === 'invalid' ? 'Link unavailable' : 'Something went wrong'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {state.phase === 'invalid' ? state.reason : state.message}
            </Typography>
            <Button variant="contained" fullWidth onClick={() => navigate('/')}>
              Go to my budgets
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
