import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { StipendSheet } from "../features/stipends/StipendReceipt";
import type { Parish, StipendReceiptData } from "../types";
import { printReport } from "./print";

/**
 * Imprime comprobantes de estipendio en hoja carta (dos por hoja, cada uno de media hoja como máximo).
 * Se renderizan aparte de la pantalla y durante la impresión se oculta el resto de la aplicación,
 * así el resultado es idéntico desde el listado de ingresos y desde el reporte de estipendios.
 */
export async function printStipendReceipts(rows: StipendReceiptData[], parish: Parish | null, title: string) {
  if (!rows.length) return;
  const host = document.createElement("div");
  host.className = "stipend-print-host";
  const style = document.createElement("style");
  style.textContent = `
    @page { size: letter; margin: 0.4in; }
    .stipend-print-host { display: none; }
    @media print {
      body.printing-stipends > #root { display: none !important; }
      body.printing-stipends > .stipend-print-host { display: block; }
      body.printing-stipends { background: #fff !important; }
    }`;
  document.head.appendChild(style);
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(<StipendSheet rows={rows} parish={parish} />));
  await Promise.all([...host.querySelectorAll("img")].map((i) => i.decode().catch(() => undefined))); // que el logo esté listo

  const theme = document.documentElement.dataset.theme;
  document.documentElement.dataset.theme = "light"; // el comprobante siempre se imprime con colores claros
  document.body.classList.add("printing-stipends");
  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    document.body.classList.remove("printing-stipends");
    if (theme) document.documentElement.dataset.theme = theme;
    root.unmount();
    host.remove();
    style.remove();
  };
  window.addEventListener("afterprint", cleanup);
  printReport(title);
}
