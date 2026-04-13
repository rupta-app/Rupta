interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, children, className }: FormFieldProps) {
  return (
    <label className={className ?? 'block'}>
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}{required && ' *'}
      </span>
      {children}
    </label>
  );
}
