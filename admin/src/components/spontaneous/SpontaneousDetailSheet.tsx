import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaPreview } from '@/components/shared/MediaPreview';
import { approveSpontaneous, rejectSpontaneous } from '@/services/spontaneous';
import type { AdminSpontaneousQuest } from '@/services/spontaneous';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface SpontaneousDetailSheetProps {
  quest: AdminSpontaneousQuest | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function SpontaneousDetailSheet({ quest, onClose, onUpdated }: SpontaneousDetailSheetProps) {
  const [auraAmount, setAuraAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [showReject, setShowReject] = useState(false);

  if (!quest) return null;

  const completion = quest.completion;
  const creator = quest.creator;
  const suggestedAura = quest.aura_reward;
  const currentAura = auraAmount === '' ? suggestedAura : parseInt(auraAmount, 10) || 0;

  async function handleApprove() {
    if (currentAura < 1 || currentAura > 500) {
      toast.error('AURA must be between 1 and 500');
      return;
    }
    if (!completion) {
      toast.error('No linked completion found');
      return;
    }

    setSaving(true);
    try {
      await approveSpontaneous(quest!.id, completion.id, currentAura);
      toast.success(
        `Approved! ${formatNumber(currentAura)} AURA awarded to @${creator?.username ?? 'user'}`,
      );
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    setSaving(true);
    try {
      await rejectSpontaneous(quest!.id);
      toast.success('Spontaneous quest rejected');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setSaving(false);
      setShowReject(false);
    }
  }

  const isPending = quest.spontaneous_review_status === 'pending_catalog';

  return (
    <>
      <Sheet open={!!quest} onClose={onClose} title="Spontaneous Review">
        {completion?.media && completion.media.length > 0 && (
          <SheetSection title="Media">
            <MediaPreview media={completion.media} size="lg" />
          </SheetSection>
        )}

        <SheetSection title="Creator">
          <div className="space-y-2">
            <UserCell
              displayName={creator?.display_name ?? null}
              username={creator?.username ?? null}
              avatarUrl={creator?.avatar_url ?? null}
              size="md"
            />
            {creator && (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="font-mono text-primary-light">
                  {formatNumber(creator.total_aura)} AURA
                </span>
                <span>
                  Joined {formatDistanceToNow(new Date(creator.created_at), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </SheetSection>

        <SheetSection title="Quest Details">
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted mb-0.5">English</p>
              <p className="font-medium text-foreground">{quest.title_en ?? '—'}</p>
              {quest.description_en && <p className="text-muted mt-0.5">{quest.description_en}</p>}
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Spanish</p>
              <p className="font-medium text-foreground">{quest.title_es ?? '—'}</p>
              {quest.description_es && <p className="text-muted mt-0.5">{quest.description_es}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              {quest.category && <Badge variant="muted">{quest.category}</Badge>}
              {quest.difficulty && <Badge variant="muted">{quest.difficulty}</Badge>}
              <StatusBadge status={quest.spontaneous_review_status} />
            </div>
          </div>
        </SheetSection>

        {completion && (
          <SheetSection title="Completion">
            <div className="space-y-2 text-sm">
              {completion.caption && (
                <p className="rounded-md shadow-xs bg-surface-elevated p-2 text-foreground">
                  {completion.caption}
                </p>
              )}
              {completion.rating && (
                <p className="text-muted">
                  Rating: {'★'.repeat(completion.rating)}{'☆'.repeat(5 - completion.rating)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(completion.completed_at), { addSuffix: true })}
              </p>
            </div>
          </SheetSection>
        )}

        {isPending && (
          <SheetSection title="Review Actions">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  AURA to Award (suggested: {suggestedAura})
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={auraAmount}
                  onChange={(e) => setAuraAmount(e.target.value)}
                  placeholder={String(suggestedAura)}
                  className="w-32"
                />
                <p className="mt-1 text-xs text-muted-foreground">1–500 range</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={saving}
                >
                  {saving ? 'Approving…' : `Approve (+${currentAura} AURA)`}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowReject(true)}
                  disabled={saving}
                >
                  Reject
                </Button>
              </div>
            </div>
          </SheetSection>
        )}
      </Sheet>

      <ConfirmDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={handleReject}
        title="Reject Spontaneous Quest"
        description="This quest will be marked as rejected. The user's completion will remain but no AURA will be awarded."
        confirmLabel="Reject"
        variant="danger"
        loading={saving}
      />
    </>
  );
}
