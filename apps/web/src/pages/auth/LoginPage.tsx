import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { authClient, signIn } from '@/lib/auth';
import { AuthCard } from '@/components/auth/AuthCard';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      setServerError(result.error.message ?? 'Sign in failed');
      return;
    }

    const redirect = searchParams.get('redirect');
    navigate(redirect ? decodeURIComponent(redirect) : '/', { replace: true });
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) return;
    await authClient
      .requestPasswordReset({ email, redirectTo: '/reset-password' })
      .catch(() => null);
    setForgotSent(true);
  };

  return (
    <AuthCard title="Budget Planner" subtitle="Plan your financial life">
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email address"
              type="email"
              fullWidth
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        {serverError && (
          <Typography variant="body2" color="error.main">
            {serverError}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 1 }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        {forgotSent ? (
          <Typography variant="body2" color="success.main" align="center">
            Password reset email sent. Check your inbox.
          </Typography>
        ) : (
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={handleForgotPassword}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
          >
            Forgot password?
          </Link>
        )}

        <Divider sx={{ my: 1 }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        <Typography variant="body2" align="center" color="text.secondary">
          New here?{' '}
          <Link component={RouterLink} to="/register" color="primary">
            Create an account
          </Link>
        </Typography>
      </Box>
    </AuthCard>
  );
}
