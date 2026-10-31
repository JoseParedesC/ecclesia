/** Fecha actual (AAAA-MM-DD) en la zona horaria de la parroquia. Configurable con APP_TIMEZONE. */
export const todayISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: process.env.APP_TIMEZONE || "America/Bogota" });
