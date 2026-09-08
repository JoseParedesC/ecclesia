'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStorage } from '../../../lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface TenantOption {
  tenantId: string;
  tenantName: string;
  role: string;
}

// Se muestra cuando el mismo usuario pertenece a varias iglesias (ver
// AuthService.loginWithGoogle -> requiresTenantSelection).
function SelectTenantContent() {
  const router = useRouter();
  const params = useSearchParams();
  const pendingToken = params.get('pendingToken') ?? '';
  const tenants: TenantOption[] = JSON.parse(params.get('tenants') ?? '[]');
  const [loading, setLoading] = useState(false);

  async function handleSelect(tenantId: string) {
    setLoading(true);
    const res = await fetch(`${API_URL}/auth/select-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ tenantId }),
    });
    const data = await res.json();
    authStorage.setTokens(data.accessToken, data.refreshToken);
    router.replace('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Selecciona tu iglesia</h1>
        {tenants.map((t) => (
          <button
            key={t.tenantId}
            disabled={loading}
            onClick={() => handleSelect(t.tenantId)}
            className="w-full border rounded-md py-2 px-4 hover:bg-gray-50 text-left"
          >
            <span className="font-medium">{t.tenantName}</span>
            <span className="block text-sm text-gray-500">{t.role}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default function SelectTenantPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando iglesias...</p>}>
      <SelectTenantContent />
    </Suspense>
  );
}
