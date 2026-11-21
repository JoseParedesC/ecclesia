import { useEffect, useState } from "react";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Spinner, Tabs, useConfirm, useToast } from "../components/ui";
import { CategoryCard, type CategorySave } from "../features/categories/CategoryCard";
import { NewCategoryPanel } from "../features/categories/NewCategoryPanel";
import type { Category, CategoryConfig } from "../types";

type WithMissing = Category & { missingEventDateCount?: number };

export default function Categories() {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [cats, setCats] = useState<Category[] | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCats(null); setError("");
    api<Category[]>(`/categories/${kind}`).then(setCats).catch((e) => setError(e.message));
  }, [kind]);

  async function save(c: Category, cfg: CategorySave) {
    setSavingId(c.id); setError("");
    try {
      const { missingEventDateCount = 0, ...category } = await send<WithMissing>(`/categories/${kind}/${c.id}`, "PATCH", cfg);
      setCats((l) => l && l.map((x) => (x.id === c.id ? category : x)));
      toast.success(missingEventDateCount > 0
        ? `Configuración guardada. ${missingEventDateCount} movimiento(s) existente(s) siguen sin fecha asociada.`
        : `Categoría «${category.name}» actualizada`);
    } catch (e) { setError((e as Error).message); } finally { setSavingId(null); }
  }

  async function create(name: string, cfg: CategoryConfig) {
    setSavingId("new"); setError("");
    try {
      const { missingEventDateCount: _m, ...category } = await send<WithMissing>(`/categories/${kind}`, "POST", { name, ...cfg });
      setCats((l) => [...(l ?? []), category]);
      toast.success(`Categoría «${category.name}» creada`);
      return true;
    } catch (e) { setError((e as Error).message); return false; } finally { setSavingId(null); }
  }

  async function remove(c: Category) {
    const ok = await confirm({ title: `Eliminar «${c.name}»`, message: "La categoría se borra definitivamente. Solo es posible si no tiene tipos asociados.", confirmLabel: "Eliminar", tone: "danger" });
    if (!ok) return;
    setError("");
    try {
      await send(`/categories/${kind}/${c.id}`, "DELETE");
      setCats((l) => l && l.filter((x) => x.id !== c.id));
      toast.success(`Categoría «${c.name}» eliminada`);
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <>
      <PageHeader title="Categorías" description="Crea categorías y define cómo se comporta cada una: valor sugerido, si se puede modificar y si maneja fecha." />
      <div className="mb-5"><Tabs value={kind} onChange={setKind} items={[{ value: "income", label: "Ingresos" }, { value: "expense", label: "Egresos" }]} /></div>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      <NewCategoryPanel key={kind} kindLabel={kind === "income" ? "ingreso" : "egreso"} saving={savingId === "new"} onCreate={create} />
      {!cats ? <div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div> : (
        <div className="space-y-4" key={kind}>
          {cats.map((c) => <CategoryCard key={c.id} category={c} saving={savingId === c.id} onSave={(cfg) => void save(c, cfg)} onDelete={() => void remove(c)} />)}
        </div>
      )}
    </>
  );
}
