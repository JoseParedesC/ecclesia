'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { ApiError } from '../../../../lib/api-error';
import { FormField, inputClass } from '../../../../components/form-field';

interface ExpenseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  supplier: string | null;
  category: { name: string };
}
interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'OTHER', label: 'Otro' },
];

const currency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPeriodClosed, setIsPeriodClosed] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    categoryId: '',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    supplier: '',
  });

  const { data } = useQuery<ExpenseItem[]>({ queryKey: ['expenses'], queryFn: () => apiClient.get('/expenses') });
  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories'),
  });
  const expenseCategories = categories?.filter((c) => c.type === 'EXPENSE') ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/expenses', {
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      setError(null);
      setIsPeriodClosed(false);
      setForm({ date: new Date().toISOString().slice(0, 10), categoryId: '', description: '', amount: '', paymentMethod: 'CASH', supplier: '' });
    },
    onError: (err: ApiError) => {
      setError(err.message);
      setIsPeriodClosed(err.isPeriodClosed);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Egresos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
        >
          {showForm ? 'Cancelar' : 'Nuevo egreso'}
        </button>
      </div>

      {error && (
        <div className={`text-sm p-3 rounded ${isPeriodClosed ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <FormField label="Fecha">
            <input
              required
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FormField>
          <FormField label="Categoría">
            <select
              required
              className={inputClass}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Descripción">
            <input
              required
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <FormField label="Valor">
            <input
              required
              type="number"
              min="0"
              className={inputClass}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </FormField>
          <FormField label="Proveedor">
            <input
              className={inputClass}
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </FormField>
          <FormField label="Método de pago">
            <select
              className={inputClass}
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
            >
              Guardar egreso
            </button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Fecha</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Descripción</th>
            <th className="p-3">Proveedor</th>
            <th className="p-3">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((e) => (
            <tr key={e.id}>
              <td className="p-3">{new Date(e.date).toLocaleDateString('es-CO')}</td>
              <td className="p-3">{e.category?.name}</td>
              <td className="p-3">{e.description}</td>
              <td className="p-3">{e.supplier ?? '-'}</td>
              <td className="p-3">{currency(e.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
