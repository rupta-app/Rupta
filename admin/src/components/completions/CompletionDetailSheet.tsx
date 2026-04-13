import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaPreview } from '@/components/shared/MediaPreview';
import { updateCompletionStatus, fetchReportsForCompletion } from '@/services/completions';
import type { AdminCompletion } from '@/services/completions';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface CompletionDetailSheetProps {
  completion: AdminCompletion | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function CompletionDetailSheet({ completion, onClose, onUpdated }: CompletionDetailSheetProps) {
  const [confirmAction, setConfirmAction] = useState<'under_review' | 'removed' | 'active' | null>(null);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Array<{
    id: string;
    reason: string;
    status: string;
    description: string | null;
    created_at: string;
    reporter: { display_name: string | null; username: string | null } | null;
  }>>([]);

  useEffect(() => {
    if (completion) {
      fetchReportsForCompletion(completion.id).then((rows) => {
        setReports(rows.map((r: Record<string, unknown>) => ({
          ...r,
          reporter: Array.isArray(r.reporter) ? r.reporter[0] ?? null : r.reporter,
        })) as typeof reports);
      }).catch(() => {});
    }
  }, [completion]);

  if (!completion) return null;

  const profile = completion.profile;
  const quest = completion.quest;

  async function handleStatusChange(status: string) {
    setSaving(true);
    try {
      await updateCompletionStatus(completion!.id, status);
      const actionMsg = status === 'removed'
        ? `Completion removed. ${completion!.aura_earned} AURA clawed back.`
        : `Completion status updated to ${status}`;
      toast.success(actionMsg);
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  }

  return (
    <>
      <Sheet open={!!completion} onClose={onClose} title="Completion Details">
        <SheetSection title="Media">
          <MediaPreview media={completion.media ?? []} size="lg" />
        </SheetSection>

        <SheetSection title="User">
          <UserCell
            displayName={profile?.display_name ?? null}
            username={profile?.username ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            size="md"
          />
        </SheetSection>

        <SheetSection title="Quest">
          <div className="space-y-2 text-sm">
            {quest ? (
              <>
                <p className="font-medium text-foreground">{quest.title_en}</p>
                {quest.title_es && (
                  <p className="text-muted">{quest.title_es}</p>
                )}
                <div className="flex gap-2">
                  {quest.category && <Badge variant="muted">{quest.category}</Badge>}
                  {quest.difficulty && <Badge variant="muted">{quest.difficulty}</Badge>}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No quest linked</p>
            )}
          </div>
        </SheetSection>

        <SheetSection title="Details">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <StatusBadge status={completion.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Source Type</span>
              <StatusBadge status={completion.quest_source_type} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">AURA Earned</span>
              <span className="font-mono font-medium text-primary-light">
                +{formatNumber(completion.aura_earned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">AURA Scope</span>
              <span className="text-foreground">{completion.aura_scope}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Visibility</span>
              <span className="text-foreground">{completion.visibility}</span>
            </div>
            {completion.rating && (
              <div className="flex justify-between">
                <span className="text-muted">Rating</span>
                <span className="text-foreground">{'★'.repeat(completion.rating)}{'☆'.repeat(5 - completion.rating)}</span>
              </div>
            )}
            {completion.caption && (
              <div>
                <span className="text-muted">Caption</span>
                <p className="mt-1 rounded-md shadow-xs bg-surface-elevated p-2 text-foreground">
                  {completion.caption}
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Completed</span>
              <span className="text-foreground">
                {formatDistanceToNow(new Date(completion.completed_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </SheetSection>

        {reports.length > 0 && (
          <SheetSection title={`Reports (${reports.length})`}>
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="rounded-md shadow-xs bg-surface-elevated p-2.5">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={r.reason} />
                    <StatusBadge status={r.status} />
                  </div>
                  {r.description && (
                    <p className="mt-1.5 text-xs text-muted">{r.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    by @{r.reporter?.username ?? 'unknown'} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </SheetSection>
        )}

        <SheetSection title="Actions">
          <div className="flex flex-wrap gap-2">
            {completion.status !== 'active' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmAction('active')}
                disabled={saving}
              >
                Restore to Active
              </Button>
            )}
            {completion.status !== 'under_review' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('under_review')}
                disabled={saving}
              >
                Set Under Review
              </Button>
            )}
            {completion.status !== 'removed' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmAction('removed')}
                disabled={saving}
              >
                Remove Completion
              </Button>
            )}
          </div>
        </SheetSection>
      </Sheet>

      <ConfirmDialog
        open={confirmAction === 'removed'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleStatusChange('removed')}
        title="Remove Completion"
        description={`This will remove the completion and automatically claw back ${formatNumber(completion.aura_earned)} AURA from the user's profile. This action can be reversed by restoring the completion.`}
        confirmLabel="Remove & Claw Back AURA"
        variant="danger"
        loading={saving}
      />
      <ConfirmDialog
        open={confirmAction === 'under_review'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleStatusChange('under_review')}
        title="Set Under Review"
        description="Mark this completion for review. No AURA changes will occur."
        confirmLabel="Set Under Review"
        loading={saving}
      />
      <ConfirmDialog
        open={confirmAction === 'active'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleStatusChange('active')}
        title="Restore Completion"
        description="Restore this completion to active status. Note: AURA will NOT be re-awarded automatically if it was previously clawed back."
        confirmLabel="Restore"
        loading={saving}
      />
    </>
  );
}
