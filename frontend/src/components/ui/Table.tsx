import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const TableWrap = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("overflow-x-auto rounded-lg border border-line bg-surface shadow-soft", className)} {...rest} />
);
export const Table = ({ className, ...rest }: HTMLAttributes<HTMLTableElement>) => <table className={cn("w-full text-left text-sm", className)} {...rest} />;
export const Th = ({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("whitespace-nowrap border-b border-line bg-mist/60 px-4 py-3 text-xs font-semibold text-muted", className)} {...rest} />
);
export const Tr = ({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("animate-fade-in print:break-inside-avoid border-b border-line last:border-0 transition-colors duration-fast hover:bg-mist/50", className)} {...rest} />
);
export const Td = ({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn("px-4 py-3 align-top", className)} {...rest} />;
