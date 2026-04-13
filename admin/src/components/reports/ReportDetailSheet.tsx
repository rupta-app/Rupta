import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserCell } from '@/components/shared/UserCell';
import { MediaPreview } from '@/components/shared/MediaPreview';
import { REASON_LABELS } from '@/lib/constants';
import { updateReportStatus, resolveReport } from '@/services/reports';
import type { AdminReport } from '@/services/reports';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface ReportDetailSheetProps {
  report: AdminReport | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ReportDetailSheet({ report, onClose, onUpdated }: ReportDetailSheetProps) {
  const [saving, setSaving] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveOptions, setResolveOptions] = useState({
    removeCompletion: true,
    warnUser: false,
    flagUser: false,
  });

  if (!report) return null;

  const hasCompletion = !!report.completion;
  const defaultRemove = ['fake_proof', 'stolen_image'].includes(report.reason);

  async function handleQuickAction(status: string) {
    setSaving(true);
    try {
      await updateReportStatus(report!.id, status);
      toast.success(`Report marked as ${status}`);
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve() {
    setSaving(true);
    try {
      await resolveReport(report!.id, {
        removeCompletion: resolveOptions.removeCompletion && hasCompletion,
        completionId: report!.completion_id,
        warnUser: resolveOptions.warnUser,
        flagUser: resolveOptions.flagUser,
        reportedUserId: report!.reported_user_id,
      });

      const actions: string[] = ['Report resolved'];
      if (resolveOptions.removeCompletion && hasCompletion) {
        actions.push(`${formatNumber(report!.completion?.aura_earned ?? 0)} AURA clawed back`);
      }
      if (resolveOptions.flagUser) actions.push('user flagged as cheater');
      else if (resolveOptions.warnUser) actions.push('user warned');

      toast.success(actions.join(', '));
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resolve');
    } finally {
      setSaving(false);
      setShowResolve(false);
    }
  }

  function openResolveDialog() {
    setResolveOptions({
      removeCompletion: defaultRemove && hasCompletion,
      warnUser: false,
      flagUser: false,
    });
    setShowResolve(true);
  }

  return (
    <>
      <Sheet open={!!report} onClose={onClose} title="Report Details">
        <SheetSection title="Report">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={report.reason} />
              <StatusBadge status={report.status} />
            </div>
            <div className="rounded-lg shadow-xs bg-surface-elevated p-3">
              <p className="text-xs font-medium text-muted mb-1">
                {REASON_LABELS[report.reason as keyof typeof REASON_LABELS] ?? report.reason}
              </p>
              {report.description ? (
                <p className="text-sm text-foreground">{report.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Filed {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              {report.reviewed_at && (
                <> · Reviewed {formatDistanceToNow(new Date(report.reviewed_at), { addSuffix: true })}</>
              )}
            </p>
          </div>
        </SheetSection>

        <SheetSection title="Reporter">
          <UserCell
            displayName={report.reporter?.display_name ?? null}
            username={report.reporter?.username ?? null}
            avatarUrl={report.reporter?.avatar_url ?? null}
            size="md"
          />
        </SheetSection>

        {report.reported_user && (
          <SheetSection title="Reported User">
            <div className="space-y-2">
              <UserCell
                displayName={report.reported_user.display_name}
                username={report.reported_user.username}
                avatarUrl={report.reported_user.avatar_url}
                size="md"
              />
              <div className="mt-2 flex items-center gap-3 text-sm">
                <StatusBadge status={report.reported_user.status} />
                <span className="font-mono text-primary-light">
                  {formatNumber(report.reported_user.total_aura)} AURA
                </span>
              </div>
            </div>
          </SheetSection>
        )}

        {report.completion && (
          <SheetSection title="Linked Completion">
            <div className="space-y-3">
              {report.completion.media && report.completion.media.length > 0 && (
                <MediaPreview media={report.completion.media} size="md" />
              )}
              <div className="space-y-1.5 text-sm">
                {report.completion.caption && (
                  <p className="rounded-md shadow-xs bg-surface-elevated p-2 text-foreground">
                    {report.completion.caption}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <StatusBadge status={report.completion.status} />
                  <span className="font-mono text-primary-light">
                    +{formatNumber(report.completion.aura_earned)} AURA
                  </span>
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(report.completion.completed_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </SheetSection>
        )}

        {report.status === 'pending' && (
          <SheetSection title="Actions">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('reviewed')}
                disabled={saving}
              >
                Mark Reviewed
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={openResolveDialog}
                disabled={saving}
              >
                Resolve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('dismissed')}
                disabled={saving}
              >
                Dismiss
              </Button>
            </div>
          </SheetSection>
        )}

        {report.status === 'reviewed' && (
          <SheetSection title="Actions">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={openResolveDialog} disabled={saving}>
                Resolve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('dismissed')} disabled={saving}>
                Dismiss
              </Button>
            </div>
          </SheetSection>
        )}
      </Sheet>

      <Dialog open={showResolve} onClose={() => setShowResolve(false)}>
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogDescription>
          Choose what actions to take when resolving this report.
        </DialogDescription>

        <div className="space-y-3">
          {hasCompletion && (
            <label className="flex items-start gap-3 rounded-md shadow-xs p-3 cursor-pointer hover:bg-surface-elevated transition-colors">
              <input
                type="checkbox"
                checked={resolveOptions.removeCompletion}
                onChange={(e) =>
                  setResolveOptions({ ...resolveOptions, removeCompletion: e.target.checked })
                }
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Remove linked completion</p>
                <p className="text-xs text-muted">
                  Claws back {formatNumber(report.completion?.aura_earned ?? 0)} AURA automatically
                </p>
              </div>
            </label>
          )}

          {report.reported_user_id && (
            <>
              <label className="flex items-start gap-3 rounded-md shadow-xs p-3 cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={resolveOptions.warnUser}
                  onChange={(e) =>
                    setResolveOptions({
                      ...resolveOptions,
                      warnUser: e.target.checked,
                      flagUser: e.target.checked ? false : resolveOptions.flagUser,
                    })
                  }
                  className="mt-0.5 accent-respect"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Warn user</p>
                  <p className="text-xs text-muted">Sets user status to &quot;warned&quot;</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-md bg-danger/5 shadow-xs p-3 cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={resolveOptions.flagUser}
                  onChange={(e) =>
                    setResolveOptions({
                      ...resolveOptions,
                      flagUser: e.target.checked,
                      warnUser: e.target.checked ? false : resolveOptions.warnUser,
                    })
                  }
                  className="mt-0.5 accent-danger"
                />
                <div>
                  <p className="text-sm font-medium text-danger-light flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Flag as cheater
                  </p>
                  <p className="text-xs text-muted">Sets user status to &quot;flagged_cheater&quot;</p>
                </div>
              </label>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowResolve(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleResolve} disabled={saving}>
            {saving ? 'Resolving…' : 'Resolve Report'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
