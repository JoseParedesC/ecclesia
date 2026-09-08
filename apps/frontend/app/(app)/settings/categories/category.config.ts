// Config de MasterCrud para el maestro de Categorías (PRD sección 11).
// Estructura basada en el README de @joseparedesc/master-crud: un mismo
// objeto `config` sirve tanto para el adaptador REST como para las columnas
// y el formulario que renderiza <MasterCrud />.
import { z } from 'zod';

export interface Category {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  name: string;
  isActive: boolean;
}

export const categoryConfig = {
  collection: 'categories',
  title: 'Categorías',
  singularTitle: 'Categoría',
  nameField: 'name',
  searchableFields: ['name', 'type'],
  columns: [
    { key: 'name', label: 'Nombre' },
    { key: 'type', label: 'Tipo', render: (c: Category) => (c.type === 'INCOME' ? 'Ingreso' : 'Egreso') },
    { key: 'isActive', label: 'Activa' },
  ],
  formFields: [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'INCOME', label: 'Ingreso' },
        { value: 'EXPENSE', label: 'Egreso' },
      ],
    },
  ],
  validationSchema: z.object({
    name: z.string().trim().min(1),
    type: z.enum(['INCOME', 'EXPENSE']),
  }),
};
