import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'SaaS Iglesias — Gestión de Eventos, Intenciones y Finanzas',
  description: 'Plataforma multiempresa para iglesias, parroquias y comunidades religiosas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
