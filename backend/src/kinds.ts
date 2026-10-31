export type Kind = "income" | "expense";

export const KINDS = {
  income: { mov: "incomes", type: "income_types", cat: "income_categories", fk: "income_type_id", stipendCode: "ESTIPENDIO" },
  expense: { mov: "expenses", type: "expense_types", cat: "expense_categories", fk: "expense_type_id", stipendCode: null },
} as const;
