import { useEffect, useState } from 'react';
import { Box, Button, Link, Typography } from '@mui/material';
import { MarkEmailUnread } from '@mui/icons-material';
import { Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import { authClient } from '@/lib/auth';
import { AuthCard } from '@/components/auth/AuthCard';

const RESEND_COOLDOWN = 60;

export default function EmailVerificationPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email: string =
    (location.state as { email?: string } | null)?.email ?? searchParams.get('email') ?? '';

  const [cooldown, setCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResendError(null);
    setResendSuccess(false);

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/',
    });

    if (result.error) {
      setResendError(result.error.message ?? 'Failed to resend email');
      return;
    }

    setResendSuccess(true);
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <AuthCard title="Check your email" subtitle="">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <MarkEmailUnread sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />

        <Typography variant="body1" align="center" color="text.secondary">
          We sent a verification link to
        </Typography>

        {email && (
          <Typography variant="body1" fontWeight={600} align="center">
            {email}
          </Typography>
        )}

        {resendSuccess && (
          <Typography variant="body2" color="success.main" align="center">
            Verification email resent. Check your inbox.
          </Typography>
        )}

        {resendError && (
          <Typography variant="body2" color="error.main" align="center">
            {resendError}
          </Typography>
        )}

        <Button
          variant="outlined"
          fullWidth
          onClick={handleResend}
          disabled={cooldown > 0}
          sx={{ mt: 1 }}
        >
          {cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          Wrong email?{' '}
          <Link component={RouterLink} to="/login" color="primary">
            Sign in again
          </Link>
        </Typography>
      </Box>
    </AuthCard>
  );
}
