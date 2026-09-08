'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm text-center space-y-6">
        <h1 className="text-xl font-semibold">Ingresar</h1>
        <a
          href={`${API_URL}/auth/google`}
          className="flex items-center justify-center gap-2 border rounded-md py-2 px-4 hover:bg-gray-50"
        >
          Continuar con Google
        </a>
      </div>
    </main>
  );
}
