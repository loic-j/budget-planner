import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signUp } from '@/lib/auth';
import { AuthCard } from '@/components/auth/AuthCard';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});

type FormValues = z.infer<typeof schema>;

const passwordCriteria = [
  { label: '8+ chars', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Special char', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function PasswordStrength({ password }: { password: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
      {passwordCriteria.map(({ label, test }) => {
        const met = test(password);
        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {met ? (
              <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <RadioButtonUnchecked sx={{ fontSize: 14, color: 'text.disabled' }} />
            )}
            <Typography variant="caption" color={met ? 'success.main' : 'text.disabled'}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      setServerError(result.error.message ?? 'Registration failed');
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <AuthCard title="Budget Planner" subtitle="Create your account">
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Full name"
              fullWidth
              autoComplete="name"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

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
            <Box>
              <TextField
                {...field}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
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
                }}
              />
              <PasswordStrength password={passwordValue} />
            </Box>
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" color="primary">
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthCard>
  );
}
