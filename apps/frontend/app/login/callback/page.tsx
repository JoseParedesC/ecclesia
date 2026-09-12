'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStorage } from '../../../lib/auth-storage';

// El backend redirige aquí después de un login exitoso de Google, con
// accessToken/refreshToken en la query string (ver AuthController.googleCallback).
export default function LoginCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      authStorage.setTokens(accessToken, refreshToken);
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return <p className="p-8 text-center">Iniciando sesión...</p>;
}
