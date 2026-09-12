'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ApiError } from '../../../lib/api-error';
import { FormField, inputClass } from '../../../components/form-field';

interface EventItem {
  id: string;
  title: string;
  eventType: string;
  startDatetime: string;
  location: string | null;
}

const EVENT_TYPES = [
  { value: 'MASS', label: 'Misa' },
  { value: 'CELEBRATION', label: 'Celebración' },
  { value: 'MEETING', label: 'Reunión' },
  { value: 'BAPTISM', label: 'Bautismo' },
  { value: 'WEDDING', label: 'Matrimonio' },
  { value: 'FUNERAL', label: 'Funeral' },
  { value: 'CONFESSION', label: 'Confesiones' },
  { value: 'PARISH_ACTIVITY', label: 'Actividad parroquial' },
  { value: 'CUSTOM', label: 'Evento personalizado' },
];

// Vista "Lista" del calendario (PRD sección 6), con alta de eventos.
// Las vistas mensual/semanal/diaria quedan pendientes (ver docs/FALTANTE.md).
export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    eventType: 'MASS',
    startDatetime: '',
    location: '',
    description: '',
  });

  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ['events'],
    queryFn: () => apiClient.get('/events'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/events', {
        ...form,
        startDatetime: new Date(form.startDatetime).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setError(null);
      setForm({ title: '', eventType: 'MASS', startDatetime: '', location: '', description: '' });
    },
    onError: (err: ApiError) => setError(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendario</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
        >
          {showForm ? 'Cancelar' : 'Nuevo evento'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <FormField label="Título">
            <input
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </FormField>

          <FormField label="Tipo de evento">
            <select
              className={inputClass}
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fecha y hora de inicio">
            <input
              required
              type="datetime-local"
              className={inputClass}
              value={form.startDatetime}
              onChange={(e) => setForm({ ...form, startDatetime: e.target.value })}
            />
          </FormField>

          <FormField label="Ubicación">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Descripción">
              <textarea
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
            >
              Guardar evento
            </button>
          </div>
        </form>
      )}

      {isLoading && <p>Cargando...</p>}
      <div className="bg-white rounded-lg shadow divide-y">
        {events?.map((e) => (
          <div key={e.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-gray-500">
                {EVENT_TYPES.find((t) => t.value === e.eventType)?.label ?? e.eventType} ·{' '}
                {e.location ?? 'Sin ubicación'}
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
