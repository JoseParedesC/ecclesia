import { auth } from "./firebase";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const getToken = async () => (auth.currentUser ? auth.currentUser.getIdToken() : null);

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const send = <T,>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) =>
  api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

/** Descarga un archivo protegido (necesita el token, por eso no es un simple <a href>). */
export async function download(path: string, filename: string) {
  const token = await getToken();
  const res = await fetch(API_URL + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("No se pudo descargar el archivo.");
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
