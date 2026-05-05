import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { apiClient } from '@/lib/api';

export default function Home() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHello = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.api.hello.$get();
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setError('Failed to reach API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHello();
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          Budget Planner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          API response:
        </Typography>

        {loading && <CircularProgress />}
        {error && <Typography color="error.main">{error}</Typography>}
        {message && (
          <Typography
            variant="h6"
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
            }}
          >
            {message}
          </Typography>
        )}

        <Button variant="contained" onClick={fetchHello} disabled={loading}>
          Ping API again
        </Button>
      </Box>
    </Container>
  );
}
