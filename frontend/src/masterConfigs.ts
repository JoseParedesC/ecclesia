import type { MasterCrudConfig } from "@joseparedesc/master-crud";
import { z } from "zod";
import type { Category, Role, TypeRow } from "./types";

/**
 * Config de los maestros de Ingresos y Egresos.
 *  - La categoría sale de la base de datos (opciones cargadas desde la API).
 *  - "Cuenta contable" solo aparece para contador y administrador (el backend también lo exige).
 */
export function buildMasterConfig(kind: "income" | "expense", categories: Category[], role: Role): MasterCrudConfig<TypeRow> {
  const isIncome = kind === "income";
  return {
    collection: isIncome ? "income-types" : "expense-types", // segmento de ruta REST
    title: isIncome ? "Tipos de ingreso" : "Tipos de egreso",
    singularTitle: isIncome ? "tipo de ingreso" : "tipo de egreso",
    codeField: "code",
    nameField: "name",
    searchableFields: ["code", "name"],
    columns: [
      { field: "code", label: "Código" },
      { field: "name", label: "Nombre" },
      { field: "categoryName", label: "Categoría" },
      { field: "accountCode", label: "Cuenta contable", render: (v) => (v ? String(v) : "—") },
    ],
    formFields: [
      { name: "code", label: "Código", type: "text", required: true, disabledOnEdit: true },
      { name: "name", label: "Nombre", type: "text", required: true },
      {
        name: "categoryId", label: "Categoría", type: "select", required: true,
        options: categories.map((c) => ({ value: String(c.id), label: c.name })),
      },
      ...(role === "contador" || role === "administrador"
        ? [{ name: "accountCode" as const, label: "Cuenta contable", type: "text" as const, helperText: "Solo el contador y el administrador pueden definirla." }]
        : []),
    ],
    validationSchema: z.object({
      code: z.string().trim().min(1, "Requerido").max(30),
      name: z.string().trim().min(1, "Requerido").max(120),
      categoryId: z.string().min(1, "Selecciona una categoría"),
      accountCode: z.string().trim().max(40).nullish(),
    }),
    allowDelete: true,
    allowDeactivate: true,
  };
}
