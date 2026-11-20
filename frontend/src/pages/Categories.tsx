import { useEffect, useState } from "react";
import { api, send } from "../api";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, Spinner, Tabs, useToast } from "../components/ui";
import { CategoryCard } from "../features/categories/CategoryCard";
import type { Category, CategoryConfig } from "../types";

export default function Categories() {
  const toast = useToast();
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [cats, setCats] = useState<Category[] | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCats(null);
    api<Category[]>(`/categories/${kind}`).then(setCats).catch((e) => setError(e.message));
  }, [kind]);

  async function save(c: Category, cfg: CategoryConfig) {
    setSavingId(c.id); setError("");
    try {
      const updated = await send<Category & { missingEventDateCount?: number }>(`/categories/${kind}/${c.id}`, "PATCH", cfg);
      const { missingEventDateCount = 0, ...category } = updated;
      setCats((l) => l && l.map((x) => (x.id === c.id ? category : x)));
      toast.success(missingEventDateCount > 0
        ? `Configuración guardada. ${missingEventDateCount} movimiento(s) existente(s) siguen sin fecha asociada.`
        : `Categoría «${c.name}» actualizada`);
    } catch (e) { setError((e as Error).message); } finally { setSavingId(null); }
  }

  return (
    <>
      <PageHeader title="Categorías" description="Define cómo se comporta cada categoría: valor sugerido, si se puede modificar y si maneja fecha." />
      <div className="mb-5"><Tabs value={kind} onChange={setKind} items={[{ value: "income", label: "Ingresos" }, { value: "expense", label: "Egresos" }]} /></div>
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {!cats ? <div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div> : (
        <div className="space-y-4" key={kind}>
          {cats.map((c) => <CategoryCard key={c.id} category={c} saving={savingId === c.id} onSave={(cfg) => void save(c, cfg)} />)}
        </div>
      )}
    </>
  );
}
