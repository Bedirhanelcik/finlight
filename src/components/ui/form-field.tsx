import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
  className?: string;
}

export function FieldWrapper({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FieldWrapperProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-negative"> *</span>}
      </label>
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground placeholder:text-subtle transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:opacity-50";

interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">,
    Omit<FieldWrapperProps, "children"> {}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
        {(id, describedBy) => (
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(inputBase, error ? "border-negative" : "border-border")}
            {...props}
          />
        )}
      </FieldWrapper>
    );
  },
);
TextInput.displayName = "TextInput";

interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id">,
    Omit<FieldWrapperProps, "children"> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
        {(id, describedBy) => (
          <textarea
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(inputBase, "min-h-20 resize-y py-2", error ? "border-negative" : "border-border")}
            {...props}
          />
        )}
      </FieldWrapper>
    );
  },
);
TextArea.displayName = "TextArea";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id">,
    Omit<FieldWrapperProps, "children"> {
  options: SelectOption[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, className, options, placeholder, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
        {(id, describedBy) => (
          <div className="relative">
            <select
              ref={ref}
              id={id}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              className={cn(inputBase, "appearance-none pr-9", error ? "border-negative" : "border-border")}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
          </div>
        )}
      </FieldWrapper>
    );
  },
);
SelectField.displayName = "SelectField";
