'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';

interface IncomeItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: { name: string };
}

// Listado de ingresos (PRD sección 9). El formulario de alta ya cuenta con
// el contrato de backend (POST /income) que valida el período contable y
// devuelve { code: "ACCOUNTING_PERIOD_CLOSED" } si corresponde (ver
// lib/api-error.ts -> ApiError.isPeriodClosed). El formulario en sí queda
// listado como pendiente en docs/IMPLEMENTADO.md.
export default function IncomePage() {
  const { data } = useQuery<IncomeItem[]>({
    queryKey: ['income'],
    queryFn: () => apiClient.get('/income'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ingresos</h1>
      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Fecha</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Descripción</th>
            <th className="p-3">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((i) => (
            <tr key={i.id}>
              <td className="p-3">{new Date(i.date).toLocaleDateString('es-CO')}</td>
              <td className="p-3">{i.category?.name}</td>
              <td className="p-3">{i.description}</td>
              <td className="p-3">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(i.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
