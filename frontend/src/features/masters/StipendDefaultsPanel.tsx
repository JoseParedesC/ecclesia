import { HandCoins, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, send } from "../../api";
import { useAuth } from "../../auth";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, MoneyInput, Spinner, Table, Td, Th, Tr, useToast } from "../../components/ui";
import { money } from "../../format";
import type { TypeRow } from "../../types";

const toRaw = (n: number | null) => (n == null ? "" : String(n));

/**
 * Valor sugerido de los tipos de ingreso de la categoría Estipendio.
 * Vive fuera de la tabla de maestros porque @joseparedesc/master-crud no admite campos con formato de moneda.
 */
export function StipendDefaultsPanel() {
  const { me } = useAuth();
  const toast = useToast();
  const canEdit = me!.role !== "secretario"; // mismos roles que pueden editar maestros
  const [rows, setRows] = useState<TypeRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const stipends = (await api<TypeRow[]>("/income-types")).filter((t) => t.categoryCode === "ESTIPENDIO");
      setRows(stipends);
      setDrafts(Object.fromEntries(stipends.map((t) => [t.id, toRaw(t.defaultAmount)])));
    } catch (e) {
      setError((e as Error).message);
      setRows((r) => r ?? []);
    }
  }, []);
  useEffect(() => void load(), [load]);

  async function save(t: TypeRow) {
    const raw = drafts[t.id] ?? "";
    const value = raw === "" ? null : Number(raw);
    if (value !== null && !(value > 0)) return setError("El valor sugerido debe ser mayor que cero (o déjalo vacío para quitarlo).");
    setError("");
    setBusyId(t.id);
    try {
      const updated = await send<TypeRow>(`/income-types/${t.id}/default-amount`, "PATCH", { defaultAmount: value });
      setRows((r) => r?.map((x) => (x.id === t.id ? updated : x)) ?? r);
      setDrafts((d) => ({ ...d, [t.id]: toRaw(updated.defaultAmount) }));
      toast.success(value === null ? "Valor sugerido quitado" : "Valor sugerido guardado");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Valor sugerido de los estipendios"
        description="Se propone como monto al registrar un ingreso de ese tipo; quien registra puede modificarlo."
        actions={<Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Actualizar lista</Button>}
      />
      {error && <div className="px-5 pt-4"><Alert tone="error">{error}</Alert></div>}
      {rows === null ? (
        <div className="flex justify-center py-10 text-primary"><Spinner className="h-5 w-5" /></div>
      ) : !rows.length ? (
        <EmptyState icon={HandCoins} title="No hay tipos de estipendio">Crea uno en la tabla de arriba con la categoría Estipendio y vuelve a pulsar «Actualizar lista».</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Código</Th><Th>Tipo</Th><Th className="text-right">Valor sugerido</Th>{canEdit && <Th><span className="sr-only">Acciones</span></Th>}</tr></thead>
            <tbody>
              {rows.map((t) => {
                const dirty = Number(drafts[t.id] || 0) !== Number(toRaw(t.defaultAmount) || 0);
                return (
                  <Tr key={t.id}>
                    <Td className="whitespace-nowrap text-muted">{t.code}</Td>
                    <Td>{t.name} {!t.active && <Badge>Inactivo</Badge>}</Td>
                    <Td className="text-right">
                      {canEdit ? (
                        <MoneyInput
                          label={`Valor sugerido de ${t.name}`} hideLabel className="ml-auto w-44" value={drafts[t.id] ?? ""}
                          onValueChange={(raw) => setDrafts((d) => ({ ...d, [t.id]: raw }))}
                        />
                      ) : (
                        <span className="tabular-nums">{t.defaultAmount != null ? money(t.defaultAmount) : "—"}</span>
                      )}
                    </Td>
                    {canEdit && (
                      <Td>
                        <div className="flex justify-end">
                          <Button size="sm" variant={dirty ? "primary" : "secondary"} disabled={!dirty} loading={busyId === t.id} onClick={() => save(t)}>
                            <Save className="h-3.5 w-3.5" aria-hidden="true" />Guardar
                          </Button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
