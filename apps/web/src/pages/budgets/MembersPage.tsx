import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

interface Member {
  id: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
  userEmail: string;
  userName: string | null;
}

interface Invite {
  id: string;
  token: string;
  role: 'EDITOR' | 'VIEWER';
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  isExpired: boolean;
  isMaxUsesReached: boolean;
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function RoleChip({ role }: { role: string }) {
  const { t } = useTranslation();
  const color = role === 'OWNER' ? 'primary' : role === 'EDITOR' ? 'info' : 'default';
  return (
    <Chip
      label={t(`role.${role}`)}
      color={color as 'primary' | 'info' | 'default'}
      size="small"
      sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
    />
  );
}

export default function MembersPage() {
  const { t } = useTranslation();
  const { id: budgetId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [creating, setCreating] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!budgetId) return;
    setLoading(true);
    try {
      const [me, memberList] = await Promise.all([
        apiFetch('/api/auth/get-session') as Promise<{ user: { id: string } }>,
        apiFetch(`/api/budgets/${budgetId}/members`) as Promise<Member[]>,
      ]);
      setMyUserId(me.user.id);
      setMembers(memberList);
      const self = memberList.find((m) => m.userId === me.user.id);
      setMyRole(self?.role ?? null);

      if (self?.role === 'OWNER') {
        const inviteList = (await apiFetch(`/api/budgets/${budgetId}/invites`)) as Invite[];
        setInvites(inviteList);
      }
    } catch {
      // non-owner gets 403 on invites — ignore
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateInvite() {
    setCreating(true);
    try {
      await apiFetch(`/api/budgets/${budgetId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      });
      setInviteDialogOpen(false);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    await apiFetch(`/api/budgets/${budgetId}/invites/${inviteId}`, { method: 'DELETE' });
    await load();
  }

  async function handleChangeRole(userId: string, role: 'EDITOR' | 'VIEWER') {
    await apiFetch(`/api/budgets/${budgetId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    await load();
  }

  async function handleRemoveMember(userId: string) {
    await apiFetch(`/api/budgets/${budgetId}/members/${userId}`, { method: 'DELETE' });
    await load();
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setSnack(t('members.copied'));
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">{t('members.title')}</Typography>
        {myRole === 'OWNER' && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            {t('members.invite')}
          </Button>
        )}
      </Box>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        {members.map((member, i) => (
          <Box key={member.userId}>
            {i > 0 && <Divider />}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {member.userName ?? member.userEmail}
                </Typography>
                {member.userName && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {member.userEmail}
                  </Typography>
                )}
              </Box>

              {myRole === 'OWNER' && member.userId !== myUserId ? (
                <Select
                  size="small"
                  value={member.role === 'OWNER' ? 'OWNER' : member.role}
                  disabled={member.role === 'OWNER'}
                  onChange={(e) =>
                    handleChangeRole(member.userId, e.target.value as 'EDITOR' | 'VIEWER')
                  }
                  sx={{ fontSize: 12, height: 28, minWidth: 90 }}
                >
                  <MenuItem value="EDITOR">{t('role.EDITOR')}</MenuItem>
                  <MenuItem value="VIEWER">{t('role.VIEWER')}</MenuItem>
                </Select>
              ) : (
                <RoleChip role={member.role} />
              )}

              {myRole === 'OWNER' && member.userId !== myUserId && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveMember(member.userId)}
                  title={t('members.removeMember')}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {myRole === 'OWNER' && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('members.inviteLinks')}
          </Typography>

          {invites.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {t('members.noActiveInvites')}
            </Typography>
          ) : (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {invites.map((invite, i) => (
                <Box key={invite.id}>
                  {i > 0 && <Divider />}
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <RoleChip role={invite.role} />
                        {(invite.isExpired || invite.isMaxUsesReached) && (
                          <Chip
                            label={t('members.exhausted')}
                            size="small"
                            color="error"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('members.usedTimes', { count: invite.useCount })}
                        {invite.maxUses ? `/${invite.maxUses}` : ''}
                        {invite.expiresAt
                          ? ` · ${t('members.expires')} ${new Date(invite.expiresAt).toLocaleDateString()}`
                          : ''}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => copyInviteLink(invite.token)}
                      title={t('members.copyInviteLink')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRevokeInvite(invite.id)}
                      title={t('members.revokeInvite')}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {t('members.createInvite')}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('members.inviteDesc')}
          </Typography>
          <Select
            fullWidth
            size="small"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
          >
            <MenuItem value="EDITOR">{t('members.editorDesc')}</MenuItem>
            <MenuItem value="VIEWER">{t('members.viewerDesc')}</MenuItem>
          </Select>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="text" onClick={() => setInviteDialogOpen(false)} disabled={creating}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleCreateInvite} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : t('members.createLink')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
