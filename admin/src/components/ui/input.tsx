import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg bg-surface px-3 py-1 text-sm text-foreground shadow-xs',
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

Input.displayName = 'Input';
