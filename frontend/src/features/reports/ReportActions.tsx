import { Printer, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, Button, Card, CardBody } from "../../components/ui";

/** Franja de filtros: no se imprime. */
export function FilterBar({ children, onRun, onPrint, loading, canPrint, error }: {
  children: ReactNode; onRun: () => void; onPrint: () => void; loading: boolean; canPrint: boolean; error: string;
}) {
  return (
    <div className="space-y-3 print:hidden">
      <Card>
        <CardBody>
          <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => { e.preventDefault(); onRun(); }}>
            {children}
            <Button type="submit" variant="primary" loading={loading}><Search className="h-4 w-4" aria-hidden="true" />Generar</Button>
            <Button onClick={onPrint} disabled={!canPrint}><Printer className="h-4 w-4" aria-hidden="true" />Imprimir</Button>
          </form>
        </CardBody>
      </Card>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
