# @joseparedesc/master-crud

Componente de administración de maestros (tabla + formulario + filtros +
confirmaciones de borrado) **100% desacoplado del backend**. Antes recibía
una instancia de `Firestore` directamente; ahora recibe un **adaptador**
que cumple el contrato `MasterCrudAdapter<T>` — así el mismo componente
sirve para Firestore, una API REST propia, o cualquier otra fuente de
datos, sin tocar una sola línea de `MasterCrud`, `MasterTable`,
`MasterForm`, etc.

## Qué cambió respecto a la versión anterior

| Antes | Ahora |
|---|---|
| `<MasterCrud db={firestoreDb} config={...} currentUser={...} />` | `<MasterCrud adapter={adapter} config={...} currentUser={...} />` |
| Lógica de Firestore incrustada en el paquete | Lógica de Firestore movida a un **adaptador opcional** en `@joseparedesc/master-crud/firestore` |
| No servía para otro backend que no fuera Firestore | Cualquier backend REST funciona con `createRestAdapter`, con rutas 100% configurables |

`config` (tu `MasterCrudConfig<T>`, con `collection`, `columns`,
`formFields`, `validationSchema`, etc.) **no cambia**. Es exactamente el
mismo objeto de siempre.

## Instalación

```bash
npm install @joseparedesc/master-crud
```

## Uso con una API REST propia (nuevo — lo que hace al paquete reutilizable)

```tsx
import { MasterCrud, createRestAdapter } from "@joseparedesc/master-crud";
import { categoryConfig } from "./category.config";

const adapter = createRestAdapter(categoryConfig, {
  baseUrl: "https://api.mi-proyecto.com/api",
  getHeaders: async () => ({
    Authorization: `Bearer ${await getMyAppToken()}`,
  }),
});

<MasterCrud adapter={adapter} config={categoryConfig} currentUser={user} />;
```

Por defecto, `createRestAdapter` asume la convención REST más común
(la misma que expone, por ejemplo, un backend NestJS típico):

```
GET    {baseUrl}/{resource}
GET    {baseUrl}/{resource}/{id}
POST   {baseUrl}/{resource}
PATCH  {baseUrl}/{resource}/{id}
PATCH  {baseUrl}/{resource}/{id}/active
GET    {baseUrl}/{resource}/{id}/references   (opcional, para pre-check)
DELETE {baseUrl}/{resource}/{id}
```

`{resource}` es `config.collection` salvo que pases `resource` explícito.

### Rutas distintas a la convención por defecto

Si tu backend no sigue esa convención (otros verbos, anidado bajo el
usuario, otra versión de API, etc.), sobreescribe **solo** la resolución
de rutas — el resto del adaptador sigue igual:

```tsx
const adapter = createRestAdapter(categoryConfig, {
  baseUrl: "https://api.mi-proyecto.com",
  resolveRoute: ({ action, resource, baseUrl, id }) => {
    switch (action) {
      case "list":
        return { url: `${baseUrl}/v2/${resource}?onlyMine=true`, method: "GET" };
      case "remove":
        return { url: `${baseUrl}/v2/${resource}/${id}/archive`, method: "POST" };
      default:
        // usa la convención por defecto para el resto de acciones
        return defaultResolveRoute({ action, resource, baseUrl, id });
    }
  },
});
```

Esto es lo que hace que el paquete sea **reutilizable por otros
proyectos**: la forma de las rutas nunca está fija en el componente ni en
el adaptador — la decide quien lo integra.

### Manejo de "no se puede eliminar: está en uso"

- Si tu backend expone `GET /{resource}/{id}/references`, el adaptador lo
  usa para advertir **antes** de pedir confirmación.
- Si no lo expone, el adaptador igual respeta un `409` en el `DELETE`
  con body `{ referencedBy: [{ description, count }] }` y muestra el
  mismo aviso — solo que después de que el usuario confirma. Ambos casos
  funcionan sin configuración adicional.

## Uso con Firestore (compatibilidad con proyectos existentes)

Vive en un entry point separado para no forzar `firebase` como
dependencia de quien no lo usa:

```tsx
import { MasterCrud } from "@joseparedesc/master-crud";
import { createFirestoreAdapter } from "@joseparedesc/master-crud/firestore";
import { firebaseDb } from "./firebase";
import { categoryConfig } from "./category.config";

const adapter = createFirestoreAdapter(firebaseDb, categoryConfig);

<MasterCrud adapter={adapter} config={categoryConfig} currentUser={user} />;
```

Reproduce exactamente el comportamiento original: registro de código
único vía transacción, borrado lógico o físico según `allowDelete` y
referencias, etc.

## Escribir tu propio adaptador

`MasterCrudAdapter<T>` es solo 7 métodos (2 opcionales). Cualquier fuente
de datos que los implemente funciona con `<MasterCrud />`:

```ts
import type { MasterCrudAdapter } from "@joseparedesc/master-crud";

const adapter: MasterCrudAdapter<Category> = {
  list, getById, create, update, setActive, remove,
  countReferences, // opcional
};
```

Por ejemplo: GraphQL, IndexedDB para modo offline, un mock en memoria para
tests, Supabase, etc. — el componente nunca lo sabe.

## Ejemplo de integración completa

Ver `examples/frontend-integration/` para el caso real: `Categories.tsx`
y `api.ts` del proyecto `personal_finance`, apuntando al backend NestJS +
PostgreSQL de referencia.
