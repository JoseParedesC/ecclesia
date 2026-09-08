'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';

interface Membership {
  id: string;
  role: string;
  isActive: boolean;
  user: { fullName: string; email: string };
}

export default function UsersSettingsPage() {
  const { data } = useQuery<Membership[]>({
    queryKey: ['tenant-users'],
    queryFn: () => apiClient.get('/users'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Nombre</th>
            <th className="p-3">Email</th>
            <th className="p-3">Rol</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((m) => (
            <tr key={m.id}>
              <td className="p-3">{m.user.fullName}</td>
              <td className="p-3">{m.user.email}</td>
              <td className="p-3">{m.role}</td>
              <td className="p-3">{m.isActive ? 'Activo' : 'Inactivo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
