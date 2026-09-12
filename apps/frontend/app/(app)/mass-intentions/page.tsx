'use client';

import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ApiError } from '../../../lib/api-error';
import { FormField, inputClass } from '../../../components/form-field';

interface Intention {
  id: string;
  description: string;
  requesterName: string;
  expectedAmount: number;
  status: string;
  donations: { amount: number }[];
}

const currency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIALLY_FUNDED: 'Parcial',
  FUNDED: 'Completa',
  CANCELLED: 'Anulada',
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'OTHER', label: 'Otro' },
];

export default function MassIntentionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [donationFor, setDonationFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: '',
    requesterName: '',
    requesterPhone: '',
    expectedAmount: '',
  });
  const [donationForm, setDonationForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    receivedAt: new Date().toISOString().slice(0, 10),
    reference: '',
  });

  const { data } = useQuery<Intention[]>({
    queryKey: ['mass-intentions'],
    queryFn: () => apiClient.get('/mass-intentions'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/mass-intentions', { ...form, expectedAmount: Number(form.expectedAmount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-intentions'] });
      setShowForm(false);
      setError(null);
      setForm({ description: '', requesterName: '', requesterPhone: '', expectedAmount: '' });
    },
    onError: (err: ApiError) => setError(err.message),
  });

  const donationMutation = useMutation({
    mutationFn: (massIntentionId: string) =>
      apiClient.post('/donations', {
        massIntentionId,
        amount: Number(donationForm.amount),
        paymentMethod: donationForm.paymentMethod,
        receivedAt: new Date(donationForm.receivedAt).toISOString(),
        reference: donationForm.reference || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-intentions'] });
      setDonationFor(null);
      setError(null);
      setDonationForm({ amount: '', paymentMethod: 'CASH', receivedAt: new Date().toISOString().slice(0, 10), reference: '' });
    },
    // Si el período de receivedAt está cerrado, err.isPeriodClosed es true
    // y err.message ya trae el texto "El período <mes> de <año> está cerrado."
    onError: (err: ApiError) => setError(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Intenciones de misa</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
        >
          {showForm ? 'Cancelar' : 'Nueva intención'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <FormField label="Intención">
            <input
              required
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Por el alma de..."
            />
          </FormField>
          <FormField label="Valor esperado">
            <input
              required
              type="number"
              min="0"
              className={inputClass}
              value={form.expectedAmount}
              onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })}
            />
          </FormField>
          <FormField label="Solicitante">
            <input
              required
              className={inputClass}
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            />
          </FormField>
          <FormField label="Teléfono del solicitante">
            <input
              className={inputClass}
              value={form.requesterPhone}
              onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
            />
          </FormField>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark"
            >
              Guardar intención
            </button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded-lg shadow text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="p-3">Solicitante</th>
            <th className="p-3">Intención</th>
            <th className="p-3">Esperado</th>
            <th className="p-3">Recibido</th>
            <th className="p-3">Estado</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((i) => {
            const received = i.donations.reduce((s, d) => s + Number(d.amount), 0);
            return (
              <Fragment key={i.id}>
                <tr>
                  <td className="p-3">{i.requesterName}</td>
                  <td className="p-3">{i.description}</td>
                  <td className="p-3">{currency(i.expectedAmount)}</td>
                  <td className="p-3">{currency(received)}</td>
                  <td className="p-3">{STATUS_LABEL[i.status] ?? i.status}</td>
                  <td className="p-3 text-right">
                    {i.status !== 'FUNDED' && (
                      <button
                        onClick={() => setDonationFor(donationFor === i.id ? null : i.id)}
                        className="text-brand text-xs underline"
                      >
                        Registrar donación
                      </button>
                    )}
                  </td>
                </tr>
                {donationFor === i.id && (
                  <tr>
                    <td colSpan={6} className="p-3 bg-gray-50">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          donationMutation.mutate(i.id);
                        }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end"
                      >
                        <FormField label="Valor">
                          <input
                            required
                            type="number"
                            min="0"
                            className={inputClass}
                            value={donationForm.amount}
                            onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Método de pago">
                          <select
                            className={inputClass}
                            value={donationForm.paymentMethod}
                            onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Fecha recibido">
                          <input
                            required
                            type="date"
                            className={inputClass}
                            value={donationForm.receivedAt}
                            onChange={(e) => setDonationForm({ ...donationForm, receivedAt: e.target.value })}
                          />
                        </FormField>
                        <button
                          type="submit"
                          disabled={donationMutation.isPending}
                          className="bg-brand text-white text-sm px-4 py-2 rounded hover:bg-brand-dark h-fit"
                        >
                          Guardar donación
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
