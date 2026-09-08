'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';

interface ExpenseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  supplier: string | null;
  category: { name: string };
}

export default function ExpensesPage() {
  const { data } = useQuery<ExpenseItem[]>({
    queryKey: ['expenses'],
    queryFn: () => apiClient.get('/expenses'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Egresos</h1>
      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Fecha</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Descripción</th>
            <th className="p-3">Proveedor</th>
            <th className="p-3">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((e) => (
            <tr key={e.id}>
              <td className="p-3">{new Date(e.date).toLocaleDateString('es-CO')}</td>
              <td className="p-3">{e.category?.name}</td>
              <td className="p-3">{e.description}</td>
              <td className="p-3">{e.supplier ?? '-'}</td>
              <td className="p-3">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(e.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
