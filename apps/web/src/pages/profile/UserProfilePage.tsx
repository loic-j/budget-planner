import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { authClient, signOut } from '@/lib/auth';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '');
    }
  }, [session]);

  async function handleSaveName() {
    setSavingName(true);
    try {
      await authClient.updateUser({ name });
      setSnack('Name updated');
    } catch {
      setSnack('Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSnack('Password changed');
    } catch {
      setPasswordError('Current password is incorrect');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (isPending) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton size="small" onClick={() => navigate('/')}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h5" sx={{ flex: 1 }}>
          Budget Planner
        </Typography>
        <Button variant="text" size="small" onClick={handleSignOut}>
          Sign out
        </Button>
      </Box>

      <Box sx={{ maxWidth: 560, mx: 'auto', p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Profile
        </Typography>

        {/* Account info */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Account information</Typography>
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={session?.user?.email ?? ''}
            disabled
            helperText="Email cannot be changed"
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Display name"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleSaveName}
              disabled={savingName || !name.trim()}
              sx={{ flexShrink: 0, height: 40 }}
            >
              {savingName ? <CircularProgress size={18} /> : 'Save'}
            </Button>
          </Box>
        </Box>

        {/* Change password */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Change password</Typography>
          <TextField
            label="Current password"
            type="password"
            size="small"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Divider />
          <TextField
            label="New password"
            type="password"
            size="small"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm new password"
            type="password"
            size="small"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? <CircularProgress size={18} /> : 'Change password'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
