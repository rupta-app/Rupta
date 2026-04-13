import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetSection } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { UserCell } from '@/components/shared/UserCell';
import { QuestForm } from '@/components/quests/QuestForm';
import { deleteSuggestion } from '@/services/suggestions';
import { createQuest } from '@/services/quests';
import type { AdminSuggestion } from '@/services/suggestions';
import type { QuestFormData } from '@/services/quests';
import { toast } from 'sonner';

interface SuggestionDetailSheetProps {
  suggestion: AdminSuggestion | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function SuggestionDetailSheet({ suggestion, onClose, onUpdated }: SuggestionDetailSheetProps) {
  const [showConvert, setShowConvert] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (!suggestion) return null;

  async function handleConvert(formData: QuestFormData) {
    await createQuest(formData);
    await deleteSuggestion(suggestion!.id);
    toast.success('Quest created from suggestion');
    setShowConvert(false);
    onUpdated();
  }

  async function handleDismiss() {
    setDismissing(true);
    try {
      await deleteSuggestion(suggestion!.id);
      toast.success('Suggestion dismissed');
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to dismiss');
    } finally {
      setDismissing(false);
      setConfirmDismiss(false);
    }
  }

  return (
    <>
      <Sheet open={!!suggestion} onClose={onClose} title="Quest Suggestion">
        <SheetSection title="Suggested By">
          <div className="space-y-2">
            <UserCell
              displayName={suggestion.user?.display_name ?? null}
              username={suggestion.user?.username ?? null}
              avatarUrl={suggestion.user?.avatar_url ?? null}
              size="md"
            />
            <p className="text-xs text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
            </p>
          </div>
        </SheetSection>

        <SheetSection title="Suggestion">
          <div className="rounded-xl bg-surface-elevated/50 p-4">
            <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
            {suggestion.description && (
              <p className="mt-2 text-sm text-muted leading-relaxed">{suggestion.description}</p>
            )}
          </div>
        </SheetSection>

        <SheetSection title="Actions">
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowConvert(true)}>
              Convert to Quest
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDismiss(true)}>
              Dismiss
            </Button>
          </div>
        </SheetSection>
      </Sheet>

      <Dialog open={showConvert} onClose={() => setShowConvert(false)} className="max-w-2xl">
        <DialogTitle>Create Quest from Suggestion</DialogTitle>
        <QuestForm
          initial={{
            title_en: suggestion.title,
            title_es: suggestion.title,
            description_en: suggestion.description ?? '',
            description_es: suggestion.description ?? '',
          }}
          onSubmit={handleConvert}
          onCancel={() => setShowConvert(false)}
          submitLabel="Create & Remove Suggestion"
        />
      </Dialog>

      <ConfirmDialog
        open={confirmDismiss}
        onClose={() => setConfirmDismiss(false)}
        onConfirm={handleDismiss}
        title="Dismiss Suggestion"
        description="This will permanently delete the suggestion. The user won't be notified."
        confirmLabel="Dismiss"
        variant="danger"
        loading={dismissing}
      />
    </>
  );
}
