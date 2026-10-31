import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Parish } from "./types";

interface ParishState { parish: Parish | null; loading: boolean; reload: () => Promise<void> }
// Valor por defecto para pantallas fuera del proveedor (por ejemplo, el login)
const Ctx = createContext<ParishState>({ parish: null, loading: false, reload: async () => {} });
export const useParish = () => useContext(Ctx);

/** Carga los datos de la parroquia una vez iniciada la sesión; se usan en el menú y en los reportes. */
export function ParishProvider({ children }: { children: ReactNode }) {
  const [parish, setParish] = useState<Parish | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try { setParish(await api<Parish | null>("/parish")); } catch { /* el menú funciona sin estos datos */ } finally { setLoading(false); }
  }, []);
  useEffect(() => void reload(), [reload]);
  return <Ctx.Provider value={{ parish, loading, reload }}>{children}</Ctx.Provider>;
}
