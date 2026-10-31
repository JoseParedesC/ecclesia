import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const sa = raw ? JSON.parse(raw) : null;
  // Algunos paneles guardan los saltos de línea de la clave como "\n" literal
  if (sa?.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, "\n");
  initializeApp({ credential: sa ? cert(sa) : applicationDefault() });
  console.log(
    `Firebase Admin → proyecto: ${sa?.project_id ?? "NO DETECTADO (FIREBASE_SERVICE_ACCOUNT vacía; usando credenciales por defecto)"}`,
  );
}
