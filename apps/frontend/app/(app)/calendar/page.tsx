'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

interface EventItem {
  id: string;
  title: string;
  eventType: string;
  startDatetime: string;
  location: string | null;
}

// Vista "Lista" del calendario (PRD sección 6). Las vistas mensual/semanal/
// diaria quedan como trabajo pendiente (ver docs/IMPLEMENTADO.md) — aquí se
// deja resuelto el contrato con el backend (GET /events?from=&to=).
export default function CalendarPage() {
  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ['events'],
    queryFn: () => apiClient.get('/events'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calendario</h1>
      {isLoading && <p>Cargando...</p>}
      <div className="bg-white rounded-lg shadow divide-y">
        {events?.map((e) => (
          <div key={e.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-gray-500">
                {e.eventType} · {e.location ?? 'Sin ubicación'}
              </p>
            </div>
            <span className="text-sm text-gray-500">{new Date(e.startDatetime).toLocaleString('es-CO')}</span>
          </div>
        ))}
        {events?.length === 0 && <p className="p-4 text-sm text-gray-500">No hay eventos programados.</p>}
      </div>
    </div>
  );
}
