'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

interface DashboardData {
  period: { year: number; month: number };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  massIntentionsCount: number;
  donationsTotal: number;
  upcomingEvents: { id: string; title: string; startDatetime: string }[];
}

const currency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/reports/dashboard'),
  });

  if (isLoading || !data) return <p>Cargando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Dashboard — {data.period.month}/{data.period.year}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Ingresos" value={currency(data.totalIncome)} />
        <Card label="Egresos" value={currency(data.totalExpense)} />
        <Card label="Balance" value={currency(data.balance)} highlight />
        <Card label="Donaciones" value={currency(data.donationsTotal)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Intenciones registradas este mes</h3>
          <p className="text-3xl font-semibold">{data.massIntentionsCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Próximos eventos</h3>
          <ul className="divide-y">
            {data.upcomingEvents.map((e) => (
              <li key={e.id} className="py-2 text-sm flex justify-between">
                <span>{e.title}</span>
                <span className="text-gray-500">
                  {new Date(e.startDatetime).toLocaleString('es-CO')}
                </span>
              </li>
            ))}
            {data.upcomingEvents.length === 0 && <p className="text-sm text-gray-500 py-2">Sin eventos próximos.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg shadow p-4 ${highlight ? 'bg-brand text-white' : 'bg-white'}`}>
      <p className={`text-sm ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
