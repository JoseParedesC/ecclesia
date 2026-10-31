import { ArrowDownToLine, ArrowUpFromLine, CalendarDays, LogOut, Menu, Printer, Settings2, Users, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth";
import { cn } from "../../lib/cn";
import { Badge, Button } from "../ui";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

const nav: { to: string; label: string; Icon: LucideIcon; needsUsers?: boolean }[] = [
  { to: "/periods", label: "Períodos", Icon: CalendarDays },
  { to: "/incomes", label: "Ingresos", Icon: ArrowDownToLine },
  { to: "/expenses", label: "Egresos", Icon: ArrowUpFromLine },
  { to: "/reports", label: "Reportes", Icon: Printer },
  { to: "/masters", label: "Maestros", Icon: Settings2 },
  { to: "/users", label: "Usuarios", Icon: Users, needsUsers: true },
];

function NavItem({ to, label, Icon }: Omit<(typeof nav)[number], "needsUsers">) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-fast ease-standard",
          isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-mist hover:text-ink",
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export function AppShell() {
  const { me, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)] print:!block">
      <div
        onClick={() => setOpen(false)} aria-hidden="true"
        className={cn("fixed inset-0 z-30 print:hidden bg-ink/40 transition-opacity duration-base lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 print:hidden flex w-[16.5rem] flex-col gap-6 border-r border-line bg-surface p-4 shadow-card",
          "transition-transform duration-slow ease-standard lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-1 pt-1">
          <Brand />
          <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="rounded p-1 text-muted hover:bg-mist lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1">{nav.filter((n) => !n.needsUsers || (me?.creatableRoles.length ?? 0) > 0).map(({ needsUsers: _u, ...n }) => <NavItem key={n.to} {...n} />)}</nav>
        <div className="mt-auto flex flex-col gap-3 rounded-lg bg-mist/70 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{me?.name ?? me?.email}</p>
            <p className="truncate text-xs text-muted">{me?.email}</p>
            <div className="mt-1.5"><Badge tone="primary"><span className="capitalize">{me?.role}</span></Badge></div>
          </div>
          <Button size="sm" variant="secondary" onClick={logout}><LogOut className="h-3.5 w-3.5" aria-hidden="true" />Cerrar sesión</Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 print:hidden flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur sm:px-6">
          <button aria-label="Abrir menú" onClick={() => setOpen(true)} className="rounded-md p-1.5 text-ink hover:bg-mist lg:hidden"><Menu className="h-5 w-5" /></button>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </header>
        <main key={pathname} className="mx-auto w-full max-w-5xl animate-fade-in p-4 sm:p-6 print:max-w-none print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
