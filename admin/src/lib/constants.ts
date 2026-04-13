export const USER_STATUSES = ['normal', 'warned', 'flagged_cheater'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const COMPLETION_STATUSES = ['active', 'under_review', 'removed'] as const;
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASONS = ['fake_proof', 'stolen_image', 'harassment', 'dangerous_content', 'spam'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const SPONTANEOUS_STATUSES = ['pending_catalog', 'promoted', 'rejected'] as const;
export type SpontaneousStatus = (typeof SPONTANEOUS_STATUSES)[number];

export const QUEST_SOURCE_TYPES = ['official', 'group', 'spontaneous'] as const;
export type QuestSourceType = (typeof QUEST_SOURCE_TYPES)[number];

export type StatusVariant = 'success' | 'warning' | 'danger' | 'muted' | 'info';

export const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // User statuses
  normal: 'success',
  warned: 'warning',
  flagged_cheater: 'danger',
  // Completion statuses
  active: 'success',
  under_review: 'warning',
  removed: 'danger',
  // Report statuses
  pending: 'warning',
  reviewed: 'info',
  resolved: 'success',
  dismissed: 'muted',
  // Spontaneous statuses
  pending_catalog: 'warning',
  promoted: 'success',
  rejected: 'danger',
  // Quest source types
  official: 'info',
  group: 'muted',
  spontaneous: 'warning',
};

export const REASON_LABELS: Record<ReportReason, string> = {
  fake_proof: 'Fake Proof',
  stolen_image: 'Stolen Image',
  harassment: 'Harassment',
  dangerous_content: 'Dangerous Content',
  spam: 'Spam',
};

export const STATUS_LABELS: Record<string, string> = {
  normal: 'Normal',
  warned: 'Warned',
  flagged_cheater: 'Flagged',
  active: 'Active',
  under_review: 'Under Review',
  removed: 'Removed',
  pending: 'Pending',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
  pending_catalog: 'Pending Review',
  promoted: 'Promoted',
  rejected: 'Rejected',
  official: 'Official',
  group: 'Group',
  spontaneous: 'Spontaneous',
  free: 'Free',
  pro: 'Pro',
};

export const PAGE_SIZE = 20;
