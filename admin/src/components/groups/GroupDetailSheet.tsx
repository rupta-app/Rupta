import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/dialog';
import { UserCell } from '@/components/shared/UserCell';
import { imageUrl } from '@/lib/mediaUrls';
import {
  fetchGroupMembers,
  updateGroupSettings,
  updateMemberRole,
  removeMember,
  deleteGroup,
} from '@/services/groups';
import type { AdminGroup, AdminGroupMember } from '@/services/groups';
import { toast } from 'sonner';

interface GroupDetailSheetProps {
  group: AdminGroup | null;
  onClose: () => void;
  onUpdated: () => void;
}

const QUEST_RULES = ['anyone', 'admin_only', 'admin_approval'] as const;
const ROLES = ['member', 'admin', 'owner'] as const;

export function GroupDetailSheet({ group, onClose, onUpdated }: GroupDetailSheetProps) {
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setMembersLoading(true);
      fetchGroupMembers(group.id, 0, 50)
        .then(({ data }) => setMembers(data))
        .catch(() => {})
        .finally(() => setMembersLoading(false));
    }
  }, [group]);

  if (!group) return null;

  async function handleSettingsChange(field: string, value: string | boolean) {
    setSaving(true);
    try {
      await updateGroupSettings(group!.id, { [field]: value });
      toast.success('Settings updated');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      await updateMemberRole(group!.id, userId, role);
      toast.success('Role updated');
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role } : m)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role');
    }
  }

  async function handleRemoveMember(userId: string, username: string | null) {
    try {
      await removeMember(group!.id, userId);
      toast.success(`@${username ?? 'user'} removed`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGroup(group!.id);
      toast.success('Group deleted');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Sheet open={!!group} onClose={onClose} title="Group Details">
        {/* Group info */}
        <div className="flex items-center gap-4 mb-6">
          {group.avatar_url ? (
            <img src={imageUrl(group.avatar_url, 'avatar')} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-lg font-bold text-primary-light">
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted">{group.description}</p>
            )}
          </div>
        </div>

        <SheetSection title="Owner">
          <UserCell
            displayName={group.owner?.display_name ?? null}
            username={group.owner?.username ?? null}
            avatarUrl={group.owner?.avatar_url ?? null}
            size="md"
          />
        </SheetSection>

        <SheetSection title="Settings">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Quest Creation</span>
              <Select
                value={group.settings?.quest_creation_rule ?? 'anyone'}
                onChange={(e) => handleSettingsChange('quest_creation_rule', e.target.value)}
                disabled={saving}
              >
                {QUEST_RULES.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Public</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={group.settings?.is_public ?? false}
                  onChange={(e) => handleSettingsChange('is_public', e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm text-foreground">
                  {group.settings?.is_public ? 'Yes' : 'No'}
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Created</span>
              <span className="text-sm text-foreground">
                {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </SheetSection>

        <SheetSection title={`Members (${members.length})`}>
          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg bg-surface-elevated/50 p-2.5"
                >
                  <UserCell
                    displayName={m.profile?.display_name ?? null}
                    username={m.profile?.username ?? null}
                    avatarUrl={m.profile?.avatar_url ?? null}
                  />
                  <div className="ml-auto flex items-center gap-2">
                    {m.role === 'owner' ? (
                      <Badge variant="info">Owner</Badge>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                        className="h-7 rounded-md bg-surface px-2 text-xs text-foreground shadow-xs"
                      >
                        {ROLES.filter((r) => r !== 'owner').map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id, m.profile?.username ?? null)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger-light"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title="Danger Zone">
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            Delete Group
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            This will permanently delete the group, all members, quests, and challenges.
          </p>
        </SheetSection>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Group"
        description={`Permanently delete "${group.name}"? All group members, quests, challenges, and scores will be removed. This cannot be undone.`}
        confirmLabel="Delete Group"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
