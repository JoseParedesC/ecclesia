import Link from 'next/link';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendario' },
  { href: '/mass-intentions', label: 'Intenciones' },
  { href: '/finance/income', label: 'Ingresos' },
  { href: '/finance/expenses', label: 'Egresos' },
  { href: '/finance/transactions', label: 'Movimientos' },
  { href: '/accounting/periods', label: 'Cierres' },
  { href: '/settings/categories', label: 'Categorías' },
  { href: '/settings/users', label: 'Usuarios' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 bg-brand-dark text-white p-4 md:min-h-screen">
        <h2 className="font-semibold mb-4">Iglesia</h2>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-3 py-2 rounded hover:bg-white/10 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
