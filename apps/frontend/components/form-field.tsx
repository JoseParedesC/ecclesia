'use client';

// Wrapper mínimo de campo de formulario reutilizado por todas las páginas
// de alta (Eventos, Intenciones, Donaciones, Ingresos, Egresos).
export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700 font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';
