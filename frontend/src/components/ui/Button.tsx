import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const variants = {
  primary: "bg-primary text-primary-ink shadow-soft hover:brightness-110",
  secondary: "border border-line bg-surface text-ink hover:bg-mist",
  ghost: "text-ink hover:bg-mist",
  danger: "bg-danger text-primary-ink shadow-soft hover:brightness-110",
} as const;
const sizes = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2" } as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, disabled, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium",
        "transition-all duration-fast ease-standard active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
});
