import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QuestForm } from './QuestForm';
import { updateQuest, deleteQuest } from '@/services/quests';
import type { AdminQuest, QuestFormData } from '@/services/quests';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface QuestDetailSheetProps {
  quest: AdminQuest | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function QuestDetailSheet({ quest, onClose, onUpdated }: QuestDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!quest) return null;

  async function handleSave(data: QuestFormData) {
    await updateQuest(quest!.id, data);
    toast.success('Quest updated');
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteQuest(quest!.id);
      toast.success('Quest deleted');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleToggleActive() {
    try {
      await updateQuest(quest!.id, { is_active: !quest!.is_active } as QuestFormData);
      toast.success(quest!.is_active ? 'Quest deactivated' : 'Quest activated');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  return (
    <>
      <Sheet open={!!quest} onClose={onClose} title={editing ? 'Edit Quest' : 'Quest Details'}>
        {editing ? (
          <QuestForm
            initial={quest}
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
            submitLabel="Save Changes"
          />
        ) : (
          <>
            <SheetSection title="English">
              <p className="text-sm font-medium text-foreground">{quest.title_en}</p>
              {quest.description_en && (
                <p className="mt-1 text-sm text-muted">{quest.description_en}</p>
              )}
            </SheetSection>

            <SheetSection title="Spanish">
              <p className="text-sm font-medium text-foreground">{quest.title_es}</p>
              {quest.description_es && (
                <p className="mt-1 text-sm text-muted">{quest.description_es}</p>
              )}
            </SheetSection>

            <SheetSection title="Properties">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Category</span>
                  <Badge variant="muted">{quest.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Difficulty</span>
                  <Badge variant="muted">{quest.difficulty}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">AURA Reward</span>
                  <span className="font-mono font-medium text-primary-light">
                    +{formatNumber(quest.aura_reward)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Repeatability</span>
                  <span className="text-foreground">{quest.repeatability_type}</span>
                </div>
                {quest.max_completions_per_user && (
                  <div className="flex justify-between">
                    <span className="text-muted">Max Completions</span>
                    <span className="text-foreground">{quest.max_completions_per_user}</span>
                  </div>
                )}
                {quest.repeat_interval && (
                  <div className="flex justify-between">
                    <span className="text-muted">Repeat Interval</span>
                    <span className="text-foreground">{quest.repeat_interval}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Proof Type</span>
                  <span className="text-foreground">{quest.proof_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cost</span>
                  <span className="text-foreground">{quest.cost_range}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Location</span>
                  <span className="text-foreground">{quest.location_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <StatusBadge status={quest.is_active ? 'active' : 'removed'} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Created</span>
                  <span className="text-foreground">
                    {formatDistanceToNow(new Date(quest.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </SheetSection>

            <SheetSection title="Actions">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit Quest
                </Button>
                <Button
                  variant={quest.is_active ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={handleToggleActive}
                >
                  {quest.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </div>
            </SheetSection>
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Quest"
        description="This will permanently delete this quest. Existing completions that reference this quest will have their quest_id set to null."
        confirmLabel="Delete Quest"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
