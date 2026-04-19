import type { GroupQuestStatus } from '@/types/database';

type Tone = 'default' | 'primary' | 'respect' | 'secondary';

export function groupQuestStatusMeta(
  status: GroupQuestStatus,
  t: (k: string) => string,
): { label: string; tone: Tone } {
  switch (status) {
    case 'draft':
      return { label: t('groups.statusDraft'), tone: 'secondary' };
    case 'active':
      return { label: t('groups.statusActive'), tone: 'primary' };
    case 'submitted_for_review':
      return { label: t('groups.statusSubmitted'), tone: 'default' };
    case 'approved_as_official':
      return { label: t('groups.statusApproved'), tone: 'respect' };
    case 'rejected':
      return { label: t('groups.statusRejected'), tone: 'default' };
    case 'archived':
      return { label: t('groups.statusArchived'), tone: 'default' };
  }
}
