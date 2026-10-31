import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// La versión de package.json queda disponible en la interfaz como __APP_VERSION__
export default defineConfig({ plugins: [react()], define: { __APP_VERSION__: JSON.stringify(version) } });
