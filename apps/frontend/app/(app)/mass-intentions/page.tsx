'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

interface Intention {
  id: string;
  description: string;
  requesterName: string;
  expectedAmount: number;
  status: string;
}

// Listado de intenciones (PRD sección 7). El formulario de alta y el flujo
// de registrar donación asociada quedan detallados como pendientes en
// docs/IMPLEMENTADO.md; los endpoints ya existen y están probados por tipo.
export default function MassIntentionsPage() {
  const { data } = useQuery<Intention[]>({
    queryKey: ['mass-intentions'],
    queryFn: () => apiClient.get('/mass-intentions'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Intenciones de misa</h1>
      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Solicitante</th>
            <th className="p-3">Intención</th>
            <th className="p-3">Esperado</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((i) => (
            <tr key={i.id}>
              <td className="p-3">{i.requesterName}</td>
              <td className="p-3">{i.description}</td>
              <td className="p-3">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(i.expectedAmount)}
              </td>
              <td className="p-3">{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
