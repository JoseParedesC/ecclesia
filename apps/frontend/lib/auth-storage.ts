// Almacenamiento simple de tokens en el cliente. En producción, considerar
// httpOnly cookies emitidas por un route handler de Next.js en vez de
// localStorage, para mitigar XSS. Se deja como mejora de Fase 2
// (ver docs/IMPLEMENTADO.md).
const ACCESS_KEY = 'iglesias_access_token';
const REFRESH_KEY = 'iglesias_refresh_token';

export const authStorage = {
  getAccessToken: () => (typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY)),
  getRefreshToken: () => (typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY)),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
