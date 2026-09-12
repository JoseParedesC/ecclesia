'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { ApiError } from '../../../../lib/api-error';
import { FormField, inputClass } from '../../../../components/form-field';

interface Membership {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  user: { fullName: string; email: string };
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador de Iglesia' },
  { value: 'OPERATOR', label: 'Operador / Secretario' },
  { value: 'VIEWER', label: 'Usuario de consulta' },
];

export default function UsersSettingsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'OPERATOR' });

  const { data } = useQuery<Membership[]>({ queryKey: ['tenant-users'], queryFn: () => apiClient.get('/users') });

  const inviteMutation = useMutation({
    mutationFn: () => apiClient.post('/users/invite', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setShowForm(false);
      setError(null);
      setForm({ email: '', fullName: '', role: 'OPERATOR' });
    },
    onError: (err: ApiError) => setError(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-users'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/users/${userId}/deactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-users'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
        >
          {showForm ? 'Cancelar' : 'Invitar usuario'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
          className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <FormField label="Nombre completo">
            <input
              required
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </FormField>
          <FormField label="Correo (Google)">
            <input
              required
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Rol">
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
            >
              Enviar invitación
            </button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Nombre</th>
            <th className="p-3">Email</th>
            <th className="p-3">Rol</th>
            <th className="p-3">Estado</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((m) => (
            <tr key={m.id}>
              <td className="p-3">{m.user.fullName}</td>
              <td className="p-3">{m.user.email}</td>
              <td className="p-3">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={m.role}
                  onChange={(e) => roleMutation.mutate({ userId: m.userId, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3">{m.isActive ? 'Activo' : 'Inactivo'}</td>
              <td className="p-3 text-right">
                {m.isActive && (
                  <button
                    onClick={() => deactivateMutation.mutate(m.userId)}
                    className="text-red-600 text-xs underline"
                  >
                    Desactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
