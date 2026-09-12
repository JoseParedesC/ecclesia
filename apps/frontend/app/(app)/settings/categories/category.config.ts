// Config de MasterCrud para el maestro de Categorías (PRD sección 11).
// Estructura basada en el README de @joseparedesc/master-crud: un mismo
// objeto `config` sirve tanto para el adaptador REST como para las columnas
// y el formulario que renderiza <MasterCrud />.
export interface Category {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  name: string;
  isActive: boolean;
}

export const categoryConfig = {
  collection: 'categories',
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
  // validationSchema: se puede conectar zod/yup aquí si el proyecto lo adopta;
  // en el MVP la validación fuerte vive en los DTOs del backend (class-validator).
};
