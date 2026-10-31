import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("overflow-hidden rounded-xl border border-line bg-surface shadow-soft transition-[colors,box-shadow] duration-base", className)} {...rest} />;
}

export function CardHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-gradient-to-b from-mist/60 to-transparent px-5 py-4">
      <div>
        <h2 className="text-lg leading-snug">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => <div className={cn("p-5", className)} {...rest} />;
