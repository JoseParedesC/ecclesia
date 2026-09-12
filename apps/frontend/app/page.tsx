import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-brand-dark">SaaS de Gestión para Iglesias</h1>
        <Link href="/login" className="inline-block bg-brand text-white px-6 py-2 rounded-md hover:bg-brand-dark">
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
