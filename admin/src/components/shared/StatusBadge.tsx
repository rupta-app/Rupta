import { Badge } from '@/components/ui/badge';
import { STATUS_VARIANT_MAP, STATUS_LABELS } from '@/lib/constants';
import type { StatusVariant } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: StatusVariant = STATUS_VARIANT_MAP[status] ?? 'muted';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}
