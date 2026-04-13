import { cn } from '@/lib/utils';
import type { StatusVariant } from '@/lib/constants';

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-secondary/15 text-secondary',
  warning: 'bg-respect/15 text-respect',
  danger: 'bg-danger/15 text-danger-light',
  muted: 'bg-muted/8 text-muted',
  info: 'bg-primary/15 text-primary-light',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'muted', dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-secondary': variant === 'success',
            'bg-respect': variant === 'warning',
            'bg-danger-light': variant === 'danger',
            'bg-muted': variant === 'muted',
            'bg-primary-light': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  );
}
