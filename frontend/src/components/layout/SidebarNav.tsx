import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";

export interface NavLeaf { to: string; label: string; Icon: LucideIcon }
export interface NavBranch { label: string; Icon: LucideIcon; children: NavLeaf[] }
export type NavNode = NavLeaf | NavBranch;
const isBranch = (n: NavNode): n is NavBranch => "children" in n;

const base = "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-fast ease-standard";
const activeCls = "bg-primary-soft text-primary_ shadow-soft before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary_ before:content-['']";
const idleCls = "text-muted hover:bg-mist hover:text-ink";
const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

export function NavItem({ to, label, Icon }: NavLeaf) {
  return (
    <NavLink to={to} className={({ isActive }) => cn(base, isActive ? activeCls : idleCls)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

/** Rama con submenú: se despliega hacia la derecha (hover, clic o teclado). */
function Branch({ node }: { node: NavBranch }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = node.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const { Icon } = node;
  return (
    <div
      ref={ref} className="relative"
      onMouseEnter={() => canHover() && setOpen(true)} onMouseLeave={() => canHover() && setOpen(false)}
    >
      <button
        type="button" aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => (canHover() ? true : !o))}
        className={cn(base, active || open ? activeCls : idleCls)}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {node.label}
        <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform duration-base ease-standard", open && "translate-x-0.5")} aria-hidden="true" />
      </button>
      {open && (
        // pl-2 puentea el espacio entre el botón y el panel para que el hover no se pierda
        <div className="absolute left-full top-0 z-50 origin-left animate-scale-in pl-2">
          <ul role="menu" aria-label={node.label} className="min-w-[13rem] space-y-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-card">
            {node.children.map((c) => (
              <li key={c.to} role="none">
                <NavLink role="menuitem" to={c.to} className={({ isActive }) => cn(base, isActive ? activeCls : idleCls)}>
                  <c.Icon className="h-4 w-4" aria-hidden="true" />
                  {c.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ items }: { items: NavNode[] }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map((n) => (isBranch(n) ? <Branch key={n.label} node={n} /> : <NavItem key={n.to} {...n} />))}
    </nav>
  );
}
