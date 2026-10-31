import type { MasterEntity } from "@joseparedesc/master-crud";
export type Role = "sacerdote" | "contador" | "administrador" | "secretario";
export interface Me { id: number; email: string; name: string | null; role: Role }
export interface Period { id: number; year: number; month: number; status: "OPEN" | "CLOSED"; closedAt: string | null }
export interface Category { id: number; code: string; name: string }
export interface TypeRow extends MasterEntity {
  categoryId: string; categoryCode: string; categoryName: string; accountCode: string | null;
}
export interface Movement {
  id: number; typeId: number; typeName: string; categoryCode: string; categoryName: string;
  accountCode: string | null; date: string; amount: number; description: string | null;
  intentionDate: string | null; periodId: number; periodStatus: "OPEN" | "CLOSED";
}
export interface Totals {
  intencion: number; donacion: number; ingresos: number; servicio: number; gasto: number; egresos: number; saldo: number;
}
