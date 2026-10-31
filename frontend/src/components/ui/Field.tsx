import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const controlClass = cn(
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink shadow-soft placeholder:text-muted/70",
  "transition-[border-color,box-shadow] duration-fast ease-standard hover:border-muted",
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger",
);

interface Shared { label: string; hint?: string; error?: string }

function Shell({ label, hint, error, id, className, children }: Shared & { id: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {children}
      {error ? <p className="animate-slide-down text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Shared>(
  ({ label, hint, error, className, ...rest }, ref) => {
    const id = useId();
    return (
      <Shell id={id} label={label} hint={hint} error={error} className={className}>
        <input id={id} ref={ref} aria-invalid={error ? true : undefined} className={controlClass} {...rest} />
      </Shell>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Shared>(
  ({ label, hint, error, className, children, ...rest }, ref) => {
    const id = useId();
    return (
      <Shell id={id} label={label} hint={hint} error={error} className={className}>
        <select id={id} ref={ref} aria-invalid={error ? true : undefined} className={controlClass} {...rest}>{children}</select>
      </Shell>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Shared>(
  ({ label, hint, error, className, ...rest }, ref) => {
    const id = useId();
    return (
      <Shell id={id} label={label} hint={hint} error={error} className={className}>
        <textarea id={id} ref={ref} aria-invalid={error ? true : undefined} className={cn(controlClass, "resize-y")} {...rest} />
      </Shell>
    );
  },
);
