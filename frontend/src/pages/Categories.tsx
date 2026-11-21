import { useEffect, useRef, useState } from "react";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Spinner, Tabs, useConfirm, useToast } from "../components/ui";
import { CategoryCard, type CategorySave } from "../features/categories/CategoryCard";
import { NewCategoryPanel, type NewCategoryDraft } from "../features/categories/NewCategoryPanel";
import type { Category } from "../types";

type Kind = "income" | "expense";
type WithMissing = Category & { missingEventDateCount?: number };
const LABEL: Record<Kind, string> = { income: "ingreso", expense: "egreso" };

export default function Categories() {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState<Kind>("income");
  // La lista guarda a qué tipo pertenece: nunca se pinta la de Ingresos bajo Egresos (ni al revés).
  const [view, setView] = useState<{ kind: Kind; cats: Category[] } | null>(null);
  const [draft, setDraft] = useState<NewCategoryDraft | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");
  const dirty = useRef(new Set<number>());
  const cats = view?.kind === kind ? view.cats : null;
  const busy = savingId !== null;

  useEffect(() => {
    let alive = true; // ignora respuestas de un tipo anterior si el usuario ya cambió
    api<Category[]>(`/categories/${kind}`)
      .then((c) => alive && setView({ kind, cats: c }))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [kind]);

  const patchList = (k: Kind, fn: (l: Category[]) => Category[]) =>
    setView((v) => (v && v.kind === k ? { kind: k, cats: fn(v.cats) } : v));

  async function changeKind(next: Kind) {
    if (next === kind || busy) return;
    const reasons = [draft && "el formulario de nueva categoría", dirty.current.size > 0 && "cambios sin guardar en otras categorías"].filter(Boolean);
    if (reasons.length) {
      const ok = await confirm({
        title: "Se perderán los datos",
        message: `Tienes ${reasons.join(" y ")}. Si cambias a ${next === "income" ? "Ingresos" : "Egresos"}, esa información se perderá.`,
        confirmLabel: "Descartar y cambiar", tone: "danger",
      });
      if (!ok) return; // el flujo sigue donde estaba
    }
    dirty.current.clear();
    setDraft(null); setError(""); setView(null);
    setKind(next);
  }

  async function save(c: Category, cfg: CategorySave) {
    if (busy) return;
    const k = kind;
    setSavingId(c.id); setError("");
    try {
      const { missingEventDateCount = 0, ...category } = await send<WithMissing>(`/categories/${k}/${c.id}`, "PATCH", cfg);
      patchList(k, (l) => l.map((x) => (x.id === c.id ? category : x)));
      toast.success(missingEventDateCount > 0
        ? `Configuración guardada. ${missingEventDateCount} movimiento(s) existente(s) siguen sin fecha asociada.`
        : `Categoría «${category.name}» actualizada`);
    } catch (e) { setError((e as Error).message); } finally { setSavingId(null); }
  }

  async function create(d: NewCategoryDraft) {
    if (busy) return;
    const k = kind;
    setSavingId("new"); setError("");
    try {
      const { missingEventDateCount: _m, ...category } = await send<WithMissing>(`/categories/${k}`, "POST", { name: d.name.trim(), ...d.cfg });
      patchList(k, (l) => (l.some((x) => x.id === category.id) ? l : [...l, category]));
      setDraft(null);
      toast.success(`Categoría «${category.name}» creada`);
    } catch (e) { setError((e as Error).message); } finally { setSavingId(null); }
  }

  async function remove(c: Category) {
    if (busy) return;
    const k = kind;
    const ok = await confirm({ title: `Eliminar «${c.name}»`, message: "La categoría se borra definitivamente. Solo es posible si no tiene tipos asociados.", confirmLabel: "Eliminar", tone: "danger" });
    if (!ok) return;
    setSavingId(c.id); setError("");
    try {
      await send(`/categories/${k}/${c.id}`, "DELETE");
      dirty.current.delete(c.id);
      patchList(k, (l) => l.filter((x) => x.id !== c.id));
      toast.success(`Categoría «${c.name}» eliminada`);
    } catch (e) { setError((e as Error).message); } finally { setSavingId(null); }
  }

  return (
    <>
      <PageHeader title="Categorías" description="Crea categorías y define cómo se comporta cada una: valor sugerido, si se puede modificar y si maneja fecha." />
      <div className={`mb-5 transition-opacity duration-300 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <Tabs value={kind} onChange={(k) => void changeKind(k)} items={[{ value: "income", label: "Ingresos" }, { value: "expense", label: "Egresos" }]} />
      </div>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {/* key={kind}: al cambiar de tipo se desmonta todo y se monta de nuevo con los datos del nuevo tipo */}
      <div key={kind}>
        {!cats ? <div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div> : (
          <>
            <NewCategoryPanel kindLabel={LABEL[kind]} draft={draft} saving={savingId === "new"} onChange={setDraft} onSubmit={(d) => void create(d)} />
            <div className="space-y-4">
              {cats.map((c) => (
                <CategoryCard key={`${kind}-${c.id}`} category={c} saving={savingId === c.id}
                  onSave={(cfg) => void save(c, cfg)} onDelete={() => void remove(c)}
                  onDirtyChange={(d) => { if (d) dirty.current.add(c.id); else dirty.current.delete(c.id); }} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
