import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3">Accept Invitation</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Token: {token} — Coming soon — Task 05
      </Typography>
    </Box>
  );
}
