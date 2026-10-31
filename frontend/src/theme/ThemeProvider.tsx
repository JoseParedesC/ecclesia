import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "light" | "dark" | "system";
type Resolved = "light" | "dark";
const KEY = "theme";

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)");
const resolve = (p: ThemePreference): Resolved => (p === "system" ? (systemDark().matches ? "dark" : "light") : p);

interface ThemeState { preference: ThemePreference; resolved: Resolved; setPreference: (p: ThemePreference) => void }
const Ctx = createContext<ThemeState>(null!);
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>(() => {
    try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; }
  });
  const [resolved, setResolved] = useState<Resolved>(() => resolve(preference));

  useEffect(() => {
    const update = () => {
      const r = resolve(preference);
      setResolved(r);
      document.documentElement.dataset.theme = r;
    };
    update();
    if (preference !== "system") return;
    const mq = systemDark();
    mq.addEventListener("change", update); // "sistema" sigue los cambios del SO en vivo
    return () => mq.removeEventListener("change", update);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    try { p === "system" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, p); } catch { /* sin storage */ }
    setPref(p);
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
