import { z } from "zod";

export const ID_TYPES = ["NIT", "CC", "TI"] as const;

const required = (label: string, max: number) =>
  z.string({ required_error: `${label} es obligatorio`, invalid_type_error: `${label} es obligatorio` })
    .trim().min(1, `${label} es obligatorio`).max(max, `${label} admite máximo ${max} caracteres`);

/** Datos del responsable que comparten ingresos y egresos. El correo es opcional. */
export const responsibleShape = {
  responsible: required("El responsable", 150),
  address: required("La dirección", 200),
  idType: z.enum(ID_TYPES, { errorMap: () => ({ message: "El tipo de identificación debe ser NIT, CC o TI" }) }),
  idNumber: required("El número de identificación", 20),
  phone: required("El teléfono de contacto", 20).regex(/^[0-9+()\s-]{7,20}$/, "Teléfono inválido"),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().email("Correo inválido").max(150).nullish(),
  ),
};

/** NIT: dígitos con guion y dígito de verificación opcional; CC y TI: solo dígitos. */
export function refineIdNumber(v: { idType: (typeof ID_TYPES)[number]; idNumber: string }, ctx: z.RefinementCtx) {
  const ok = v.idType === "NIT" ? /^\d{6,12}(-\d)?$/.test(v.idNumber) : /^\d{5,12}$/.test(v.idNumber);
  if (!ok)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["idNumber"],
      message: v.idType === "NIT" ? "NIT inválido: solo dígitos, con guion y dígito de verificación opcional" : "Número de identificación inválido: solo dígitos",
    });
}
