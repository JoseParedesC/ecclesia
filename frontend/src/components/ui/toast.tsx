import { CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface Toast { id: number; message: string }
const Ctx = createContext<{ success: (m: string) => void }>({ success: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  const dismiss = (id: number) => setItems((l) => l.filter((t) => t.id !== id));
  const success = useCallback((message: string) => {
    const id = next.current++;
    setItems((l) => [...l, { id, message }]);
    setTimeout(() => dismiss(id), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ success }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex animate-slide-up items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-sm shadow-card">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span className="flex-1">{t.message}</span>
            <button aria-label="Cerrar aviso" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-muted transition-colors hover:bg-mist hover:text-ink"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
