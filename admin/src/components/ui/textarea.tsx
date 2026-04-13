import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full rounded-lg bg-surface px-3 py-2 text-sm text-foreground shadow-xs',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'transition-shadow duration-150',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
