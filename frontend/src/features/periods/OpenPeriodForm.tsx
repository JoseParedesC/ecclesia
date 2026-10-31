import { useState, type FormEvent } from "react";
import { Button, Card, CardBody, Input, Select } from "../../components/ui";
import { MONTHS } from "../../format";

export function OpenPeriodForm({ onOpen, busy }: { onOpen: (year: number, month: number) => void; busy: boolean }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const submit = (e: FormEvent) => { e.preventDefault(); onOpen(year, month); };

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
          <Select label="Mes" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-44">
            {MONTHS.map((m, i) => <option key={m} value={i + 1} className="capitalize">{m}</option>)}
          </Select>
          <Input label="Año" type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" />
          <Button type="submit" variant="primary" loading={busy}>Abrir período</Button>
        </form>
      </CardBody>
    </Card>
  );
}
