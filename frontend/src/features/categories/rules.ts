import type { Category, CategoryConfig } from "../../types";

/** Coherencia: lo dependiente se apaga con su interruptor padre (el backend aplica lo mismo). */
export const normalizeConfig = (c: CategoryConfig): CategoryConfig => ({
  ...c,
  defaultAmountEditable: c.hasDefaultAmount ? c.defaultAmountEditable : true,
  dateRequired: c.usesDate ? c.dateRequired : false,
});
export const toConfig = (c: Category): CategoryConfig => ({
  hasDefaultAmount: c.hasDefaultAmount, defaultAmountEditable: c.defaultAmountEditable, usesDate: c.usesDate, dateRequired: c.dateRequired,
});
export const sameConfig = (a: CategoryConfig, b: CategoryConfig) =>
  a.hasDefaultAmount === b.hasDefaultAmount && a.defaultAmountEditable === b.defaultAmountEditable && a.usesDate === b.usesDate && a.dateRequired === b.dateRequired;
