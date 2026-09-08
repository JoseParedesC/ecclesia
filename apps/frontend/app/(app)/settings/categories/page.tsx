'use client';

// Uso del maestro genérico documentado en el README de
// @joseparedesc/master-crud, sección "Uso con una API REST propia".
import { MasterCrud, createRestAdapter } from '@joseparedesc/master-crud';
import { categoryConfig } from './category.config';
import { authStorage } from '../../../../lib/auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const adapter = createRestAdapter(categoryConfig, {
  baseUrl: API_URL,
  getHeaders: async () => ({
    Authorization: `Bearer ${authStorage.getAccessToken() ?? ''}`,
  }),
  // El backend (CategoriesController) sigue exactamente la convención por
  // defecto: GET/POST /categories, PATCH/DELETE /categories/:id,
  // PATCH /categories/:id/active, GET /categories/:id/references.
  // Por eso no se sobreescribe resolveRoute aquí.
});

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categorías</h1>
      <p className="text-sm text-gray-500">
        Categorías de ingresos y egresos configurables por iglesia (PRD sección 11).
      </p>
      <MasterCrud
        adapter={adapter}
        config={categoryConfig as never}
        currentUser={{ uid: 'current-user' }}
      />
    </div>
  );
}
