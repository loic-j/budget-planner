import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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

const PASSWORD_TESTS = [
  { key: 'auth.criteria8chars', test: (v: string) => v.length >= 8 },
  { key: 'auth.criteriaUppercase', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'auth.criteriaNumber', test: (v: string) => /[0-9]/.test(v) },
  { key: 'auth.criteriaSpecial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
      {PASSWORD_TESTS.map(({ key, test }) => {
        const met = test(password);
        return (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {met ? (
              <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <RadioButtonUnchecked sx={{ fontSize: 14, color: 'text.disabled' }} />
            )}
            <Typography variant="caption" color={met ? 'success.main' : 'text.disabled'}>
              {t(key)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation();
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
    <AuthCard title="Budget Planner" subtitle={t('auth.registerSubtitle')}>
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
              label={t('auth.name')}
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
              label={t('auth.email')}
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
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
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
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          {t('auth.hasAccount')}{' '}
          <Link component={RouterLink} to="/login" color="primary">
            {t('auth.signIn')}
          </Link>
        </Typography>
      </Box>
    </AuthCard>
  );
}
