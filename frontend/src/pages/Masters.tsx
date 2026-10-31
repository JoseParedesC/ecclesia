import { MasterCrud, createRestAdapter } from "@joseparedesc/master-crud";
import { useEffect, useMemo, useState } from "react";
import { API_URL, api, getToken } from "../api";
import { useAuth } from "../auth";
import { buildMasterConfig } from "../masterConfigs";
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

  if (!config || !adapter) return <p className="muted">Cargando…</p>;
  return <MasterCrud adapter={adapter} config={config} currentUser={{ uid: String(me!.id) }} />;
}

export default function Masters() {
  const [kind, setKind] = useState<"income" | "expense">("income");
  return (
    <>
      <h1>Maestros</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={kind === "income"} onClick={() => setKind("income")}>Ingresos</button>
        <button role="tab" aria-selected={kind === "expense"} onClick={() => setKind("expense")}>Egresos</button>
      </div>
      <MasterTab kind={kind} key={kind} />
    </>
  );
}
