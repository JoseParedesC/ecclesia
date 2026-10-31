import { MasterCrud, createRestAdapter } from "@joseparedesc/master-crud";
import { useEffect, useMemo, useState } from "react";
import { API_URL, api, getToken } from "../api";
import { useAuth } from "../auth";
import { buildMasterConfig } from "../masterConfigs";
import { PageHeader } from "../components/layout/PageHeader";
import { Spinner, Tabs } from "../components/ui";
import type { Category, TypeRow } from "../types";

function MasterTab({ kind }: { kind: "income" | "expense" }) {
  const { me } = useAuth();
  const [cats, setCats] = useState<Category[] | null>(null);

  useEffect(() => {
    setCats(null);
    api<Category[]>(`/categories/${kind}`).then(setCats);
  }, [kind]);

  const config = useMemo(() => cats && buildMasterConfig(kind, cats, me!.role), [cats, kind, me]);
  const adapter = useMemo(
    () =>
      config &&
      createRestAdapter<TypeRow>(config, {
        baseUrl: API_URL,
        getHeaders: async () => ({ Authorization: `Bearer ${await getToken()}` }),
      }),
    [config],
  );

  if (!config || !adapter) return <div className="flex justify-center py-16 text-primary_"><Spinner className="h-6 w-6" /></div>;
  return <MasterCrud adapter={adapter} config={config} currentUser={{ uid: String(me!.id) }} />;
}

export default function Masters() {
  const [kind, setKind] = useState<"income" | "expense">("income");
  return (
    <>
      <PageHeader title="Maestros" description="Tipos de ingreso y de egreso con su categoría. La cuenta contable la definen el contador y el administrador." />
      <div className="mb-5">
        <Tabs value={kind} onChange={setKind} items={[{ value: "income", label: "Ingresos" }, { value: "expense", label: "Egresos" }]} />
      </div>
      <div className="animate-fade-in" key={kind}><MasterTab kind={kind} /></div>
    </>
  );
}
