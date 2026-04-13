import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Shield, ShieldOff } from 'lucide-react';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MediaThumbnail } from '@/components/shared/MediaPreview';
import { USER_STATUSES, STATUS_LABELS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { updateUserStatus, updateUserAdmin } from '@/services/users';
import { fetchCompletionsByUser } from '@/services/completions';
import { fetchReportCountsForUser } from '@/services/reports';
import type { AdminProfile } from '@/services/users';
import { toast } from 'sonner';

interface UserDetailSheetProps {
  user: AdminProfile | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function UserDetailSheet({ user, onClose, onUpdated }: UserDetailSheetProps) {
  const [completions, setCompletions] = useState<Array<{
    id: string;
    quest_source_type: string;
    status: string;
    aura_earned: number;
    completed_at: string;
    caption: string | null;
    quest: { title_en: string | null; title_es: string | null } | null;
    media: Array<{ id: string; media_url: string; media_type: string }>;
  }>>([]);
  const [reportCount, setReportCount] = useState(0);
  const [confirmAdmin, setConfirmAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCompletionsByUser(user.id).then((rows) => {
        // Flatten Supabase array joins
        setCompletions(rows.map((r: Record<string, unknown>) => ({
          ...r,
          quest: Array.isArray(r.quest) ? r.quest[0] ?? null : r.quest,
          media: Array.isArray(r.media) ? r.media : [],
        })) as typeof completions);
      }).catch(() => {});
      fetchReportCountsForUser(user.id).then(setReportCount).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  async function handleStatusChange(status: string) {
    setSaving(true);
    try {
      await updateUserStatus(user!.id, status);
      toast.success(`User status updated to ${STATUS_LABELS[status]}`);
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdmin() {
    setSaving(true);
    try {
      await updateUserAdmin(user!.id, !user!.is_admin);
      toast.success(user!.is_admin ? 'Admin access revoked' : 'Admin access granted');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update admin status');
    } finally {
      setSaving(false);
      setConfirmAdmin(false);
    }
  }

  return (
    <>
      <Sheet open={!!user} onClose={onClose} title="User Details">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary-light">
              {(user.display_name ?? user.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{user.display_name ?? 'Unknown'}</h3>
            <p className="text-sm text-muted">@{user.username ?? '—'}</p>
          </div>
        </div>

        <SheetSection title="AURA">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg shadow-xs bg-surface-elevated p-3">
              <p className="text-xs text-muted">Total</p>
              <p className="text-xl font-bold text-primary-light">{formatNumber(user.total_aura)}</p>
            </div>
            <div className="rounded-lg shadow-xs bg-surface-elevated p-3">
              <p className="text-xs text-muted">Yearly</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(user.yearly_aura)}</p>
            </div>
          </div>
        </SheetSection>

        <SheetSection title="Status & Role">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Status</span>
              <Select
                value={user.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
              >
                {USER_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Admin Access</span>
              <Button
                variant={user.is_admin ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setConfirmAdmin(true)}
                disabled={saving}
              >
                {user.is_admin ? (
                  <><ShieldOff size={14} /> Revoke Admin</>
                ) : (
                  <><Shield size={14} /> Grant Admin</>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Plan</span>
              <Badge variant={user.plan === 'pro' ? 'info' : 'muted'}>
                {STATUS_LABELS[user.plan ?? 'free']}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Reports Against</span>
              {reportCount > 0 ? (
                <Badge variant="danger">{reportCount} reports</Badge>
              ) : (
                <span className="text-sm text-foreground">None</span>
              )}
            </div>
          </div>
        </SheetSection>

        <SheetSection title="Info">
          <div className="space-y-2 text-sm">
            {user.bio && <p className="text-muted">{user.bio}</p>}
            <div className="flex justify-between">
              <span className="text-muted">City</span>
              <span className="text-foreground">{user.city ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">DOB</span>
              <span className="text-foreground">{user.date_of_birth ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Joined</span>
              <span className="text-foreground">
                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </SheetSection>

        {user.preferred_categories && user.preferred_categories.length > 0 && (
          <SheetSection title="Categories">
            <div className="flex flex-wrap gap-1.5">
              {user.preferred_categories.map((c) => (
                <Badge key={c} variant="muted">{c}</Badge>
              ))}
            </div>
          </SheetSection>
        )}

        <SheetSection title={`Recent Completions (${completions.length})`}>
          {completions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completions</p>
          ) : (
            <div className="space-y-2">
              {completions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-md shadow-xs bg-surface-elevated p-2.5"
                >
                  <MediaThumbnail
                    url={c.media?.[0]?.media_url ?? null}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.quest?.title_en ?? c.caption ?? 'Untitled'}
                    </p>
                    <p className="text-xs text-muted">
                      +{c.aura_earned} AURA · {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </SheetSection>
      </Sheet>

      <ConfirmDialog
        open={confirmAdmin}
        onClose={() => setConfirmAdmin(false)}
        onConfirm={handleToggleAdmin}
        title={user.is_admin ? 'Revoke Admin Access' : 'Grant Admin Access'}
        description={
          user.is_admin
            ? `Remove admin privileges from @${user.username}?`
            : `Grant full admin privileges to @${user.username}? They will be able to manage users, completions, and reports.`
        }
        confirmLabel={user.is_admin ? 'Revoke' : 'Grant'}
        variant={user.is_admin ? 'danger' : 'primary'}
        loading={saving}
      />
    </>
  );
}
