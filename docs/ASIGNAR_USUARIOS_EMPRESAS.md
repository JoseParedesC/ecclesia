# Asignar usuarios a empresas en Ecclesia

## Concepto

Ecclesia utiliza una relación multiempresa entre usuarios y empresas (iglesias). Un usuario puede pertenecer a varias empresas y tener un rol diferente en cada una.

La empresa activa **no se envía en el body** de las peticiones. Se obtiene del JWT mediante el `tenantId` de la sesión autenticada.

## Roles disponibles

| Rol | Permisos generales |
|---|---|
| `ADMIN` | Gestionar usuarios, roles y operaciones administrativas de la empresa |
| `OPERATOR` | Operar los módulos de negocio permitidos |
| `VIEWER` | Consultar información |

## Requisitos

1. Backend ejecutándose en `http://localhost:3001`.
2. Base de datos migrada y disponible.
3. Usuario autenticado mediante Google.
4. El usuario que asigna debe tener rol `ADMIN` en la empresa activa.
5. El frontend debe estar ejecutándose en `http://localhost:3000`.

## Flujo de asignación

1. Un administrador inicia sesión en Ecclesia.
2. El administrador abre la sección de usuarios de la empresa.
3. Envía el correo, nombre y rol del usuario.
4. Ecclesia crea el usuario si todavía no existe.
5. Ecclesia crea la relación usuario-empresa (`UserTenant`).
6. El usuario invitado inicia sesión con Google usando el mismo correo.
7. Si pertenece a varias empresas, selecciona la empresa activa después del login.

## Invitar o asignar un usuario

### Endpoint

```http
POST http://localhost:3001/api/users/invite
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Body

```json
{
  "email": "secretaria@ejemplo.com",
  "fullName": "María Secretaria",
  "role": "OPERATOR"
}
```

Los valores permitidos para `role` son:

```text
ADMIN
OPERATOR
VIEWER
```

### Ejemplo con PowerShell

```powershell
$body = @{
  email = "secretaria@ejemplo.com"
  fullName = "María Secretaria"
  role = "OPERATOR"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/api/users/invite" `
  -Headers @{ Authorization = "Bearer <ACCESS_TOKEN>" } `
  -ContentType "application/json" `
  -Body $body
```

### Ejemplo con curl

```bash
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "secretaria@ejemplo.com",
    "fullName": "María Secretaria",
    "role": "OPERATOR"
  }'
```

La respuesta incluye la relación creada y los datos del usuario:

```json
{
  "id": "membership-id",
  "userId": "user-id",
  "tenantId": "company-id",
  "role": "OPERATOR",
  "isActive": true,
  "user": {
    "id": "user-id",
    "email": "secretaria@ejemplo.com",
    "fullName": "María Secretaria"
  }
}
```

## Listar usuarios de la empresa activa

```http
GET http://localhost:3001/api/users
Authorization: Bearer <ACCESS_TOKEN>
```

Solo un usuario con rol `ADMIN` puede consultar esta lista.

## Cambiar el rol de un usuario

```http
PATCH http://localhost:3001/api/users/<USER_ID>/role
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "role": "VIEWER"
}
```

El usuario debe pertenecer a la empresa activa. Cambiar el rol en una empresa no cambia sus roles en otras empresas.

## Desactivar un usuario en una empresa

```http
PATCH http://localhost:3001/api/users/<USER_ID>/deactivate
Authorization: Bearer <ACCESS_TOKEN>
```

Esto desactiva únicamente la relación con la empresa activa. No elimina el usuario global ni sus relaciones con otras empresas.

## Errores frecuentes

### Usuario sin empresa asignada

```json
{
  "code": "UnauthorizedException",
  "message": "Este usuario no pertenece a ninguna iglesia. Solicite una invitación."
}
```

Significa que el usuario inició sesión con Google, pero todavía no existe una relación activa entre su usuario y una empresa. Un administrador debe asignarlo mediante `POST /api/users/invite`.

El correo usado para iniciar sesión debe coincidir exactamente con el correo invitado.

### Usuario ya asignado

```json
{
  "statusCode": 409,
  "message": "Este usuario ya pertenece a la iglesia.",
  "error": "Conflict"
}
```

La relación ya existe para la empresa activa. En ese caso, usa el endpoint de cambio de rol o de desactivación.

### Sin permisos de administrador

Un usuario que no tenga rol `ADMIN` en la empresa activa recibirá un error de autorización al intentar gestionar usuarios.

### Varias empresas

Si el usuario pertenece a varias empresas, el login redirige a:

```text
http://localhost:3000/login/select-tenant
```

Debe seleccionar una empresa para recibir un token con su `tenantId` y rol activos.

## Modelo de datos

La asignación se almacena en `UserTenant`:

```text
User 1 --- N UserTenant N --- 1 Tenant
```

La combinación `userId + tenantId` es única. Por eso un mismo usuario solo puede tener una relación por empresa, aunque sí puede pertenecer a varias empresas.

## Comandos relacionados

Desde la raíz del proyecto:

```bash
npm run db:up
npm run db:migrate
npm run dev:backend
npm run dev:frontend
```

URLs locales:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001/api
```
