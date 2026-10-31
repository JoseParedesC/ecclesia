import type { MasterEntity } from "@joseparedesc/master-crud";
export type Role = "sacerdote" | "contador" | "administrador" | "secretario";
export interface Me { id: number; email: string; name: string | null; role: Role; creatableRoles: Role[] }
export interface Period { id: number; year: number; month: number; status: "OPEN" | "CLOSED"; closedAt: string | null }
export interface Parish {
  name: string; department: string; city: string; address: string;
  logo: string | null; email: string | null; phone: string | null;
}
export interface Category { id: number; code: string; name: string }
export interface TypeRow extends MasterEntity {
  categoryId: string; categoryCode: string; categoryName: string; accountCode: string | null;
}
export type IdType = "NIT" | "CC" | "TI";
export const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "NIT", label: "NIT" }, { value: "CC", label: "CC · Cédula de ciudadanía" }, { value: "TI", label: "TI · Tarjeta de identidad" },
];
export interface Movement {
  id: number; typeId: number; typeName: string; categoryCode: string; categoryName: string;
  accountCode: string | null; date: string; amount: number; description: string | null;
  intentionDate: string | null; periodId: number; periodStatus: "OPEN" | "CLOSED";
  /** Datos del responsable (los registros anteriores a esta versión pueden venir vacíos). */
  responsible: string | null; address: string | null; idType: IdType | null; idNumber: string | null;
  phone: string | null; email: string | null;
}
export interface Totals {
  intencion: number; donacion: number; ingresos: number; servicio: number; gasto: number; egresos: number; saldo: number;
}

export interface UserRow { id: number; email: string; name: string | null; role: Role; active: boolean }

export interface ReportRow {
  id: number; date: string; type: string; category: string; categoryName: string; account?: string | null;
  description: string | null; intentionDate: string | null; amount: number;
  responsible?: string | null; idType?: IdType | null; idNumber?: string | null;
}
export interface ReportTotals { count: number; total: number; byCategory: { code: string; name: string; count: number; total: number }[] }
export interface ReportResult { rows: ReportRow[]; totals: ReportTotals }
export interface Consolidado { period: Period; incomes: ReportRow[]; expenses: ReportRow[]; totals: Totals }
