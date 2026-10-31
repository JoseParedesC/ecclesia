import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";

interface Options { title: string; message: string; confirmLabel?: string; tone?: "primary" | "danger" }
type Ask = (o: Options) => Promise<boolean>;
const Ctx = createContext<Ask>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(Options & { resolve: (v: boolean) => void }) | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>((o) => new Promise((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };

  useEffect(() => {
    if (!state) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (state.resolve(false), setState(null));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <Ctx.Provider value={ask}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={() => close(false)} />
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="relative w-full max-w-sm animate-scale-in rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 id="confirm-title" className="text-lg">{state.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{state.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>Cancelar</Button>
              <Button ref={confirmRef} variant={state.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>{state.confirmLabel ?? "Confirmar"}</Button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
