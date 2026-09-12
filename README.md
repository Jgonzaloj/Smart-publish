# Backend — Sistema de créditos personales (multi-tenant)

Backend en NestJS + PostgreSQL + Prisma. Cada empresa (administrador) tiene sus
datos completamente aislados mediante Row Level Security (RLS) de PostgreSQL,
no solo por filtros en el código.

## Qué incluye esta primera entrega

- **Autenticación** (`/auth/login`, `/auth/registro-negocio`) con JWT que lleva `tenantId` y `rol`.
- **Aislamiento multi-tenant real** vía RLS (`prisma/rls_policies.sql`) — no depende de que el
  programador nunca olvide un `WHERE tenant_id = ...`.
- **Usuarios/vendedores** (`/usuarios/vendedores`) — solo el ADMIN puede crear/listar/desactivar.
- **Clientes + créditos** (`/clientes`) — equivalente a la pantalla "Ventas Nuevas" (incluye
  codeudor opcional).
- **Abonos** (`/abonos`) — equivalente al comprobante de pago, actualiza el saldo automáticamente.
- **Caja** (`/caja`) — ingresos/egresos manuales, retiro de caja, y cuadre diario (en vivo y para cerrar el día).
  El administrador tiene una vista consolidada de todos sus vendedores (`/caja/cuadre/resumen-admin`).

Lo que falta (según el documento de skills que ya tienes): mora automática, renovación,
enrutamiento, clientes ausentes, notificaciones, PIN de app. La base ya está lista para
agregarlos con el mismo patrón.

## 1. Requisitos previos

Necesitas instalar en tu computadora:

1. **Node.js** versión 18 o superior — https://nodejs.org
2. **PostgreSQL** versión 14 o superior — https://www.postgresql.org/download/
   (o usa un servicio en la nube como Supabase/Neon/Railway, que ya te dan PostgreSQL gratis)

## 2. Instalación

```bash
cd backend
npm install --legacy-peer-deps
```

(El flag `--legacy-peer-deps` es necesario por un conflicto de versiones entre
`@nestjs/schedule` y el resto de paquetes de NestJS — el mismo flag que ya usa
`Dockerfile` internamente.)

## 3. Configurar la base de datos

1. Crea una base de datos vacía en PostgreSQL, por ejemplo `creditos_db`.
2. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` con tu usuario/clave real.
3. Crea las tablas a partir del schema de Prisma:

```bash
npx prisma migrate dev --name init
```

4. Activa el aislamiento por tenant (Row Level Security) ejecutando el archivo SQL,
   **y luego** la función de login (necesaria para que el login funcione con RLS
   estricto activo — ver corrección del hallazgo 1.3 en la auditoría):

```bash
psql "$DATABASE_URL" -f prisma/rls_policies.sql
psql "$DATABASE_URL" -f prisma/rls_auth_function.sql
```

O usa el script que hace ambos pasos y falla visiblemente si algo sale mal:

```bash
node scripts/apply-rls.js
```

(Si usas una herramienta visual como pgAdmin o DBeaver, abre ambos archivos
`prisma/rls_policies.sql` y `prisma/rls_auth_function.sql`, en ese orden, y
ejecútalos contra tu base de datos con el rol dueño de las tablas, no con `app_user`.)

**Importante sobre el modo memoria:** si `DATABASE_URL` falta o Postgres no responde,
la aplicación **ya no arranca en silencio en modo memoria** (eso anulaba el
aislamiento entre empresas). Ahora, si quieres una demo rápida sin PostgreSQL,
tienes que pedirlo explícitamente con `ALLOW_MEMORY_MODE=true` en tu `.env` — y
nunca debe estar presente en un despliegue con datos reales.

## 4. Levantar el servidor

```bash
npm run start:dev
```

Debe salir: `Backend corriendo en http://localhost:3000`

## 5. Probar que funciona (con curl o Postman)

**Crear el primer negocio y su administrador:**
```bash
curl -X POST http://localhost:3000/auth/registro-negocio \
  -H "Content-Type: application/json" \
  -d '{"nombreNegocio":"Mi Negocio","adminNombre":"Juan Pérez","email":"admin@negocio.com","password":"clave123"}'
```

Esto devuelve un `accessToken`. Úsalo en el header `Authorization: Bearer <token>`
para todos los demás endpoints.

**Crear un vendedor (como admin):**
```bash
curl -X POST http://localhost:3000/usuarios/vendedores \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos Cobrador","email":"carlos@negocio.com","password":"clave123","posicion":"1"}'
```

## 6. Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma        <- todas las tablas
│   └── rls_policies.sql     <- aislamiento por tenant (ejecutar aparte)
├── src/
│   ├── auth/                <- login, registro de negocio, JWT
│   ├── common/
│   │   ├── guards/           <- JwtAuthGuard
│   │   └── decorators/       <- @Roles(), @CurrentUser()
│   ├── prisma/               <- conexión a BD + helper withTenant()
│   ├── usuarios/             <- gestión de vendedores (solo admin)
│   ├── clientes/             <- "Ventas Nuevas": cliente + crédito + codeudor
│   ├── abonos/                <- registro de pagos de cuota
│   └── caja/                  <- ingresos/egresos, retiro de caja, cuadre diario
```

## 7. Endpoints de caja (nuevo)

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/caja/movimientos` | admin/vendedor | Registra un ingreso o egreso manual |
| GET | `/caja/movimientos?fecha=YYYY-MM-DD` | admin/vendedor | Lista movimientos del día (vendedor ve solo los suyos) |
| POST | `/caja/retiro` | admin/vendedor | Registra un retiro de efectivo de la caja |
| GET | `/caja/cuadre/hoy?fecha=YYYY-MM-DD` | admin/vendedor | Cuadre calculado en vivo: cobrado, prestado, ingresos, egresos, retiros, saldo esperado |
| POST | `/caja/cuadre/cerrar` | admin/vendedor | Cierra y guarda el cuadre del día del usuario logueado |
| GET | `/caja/cuadre/resumen-admin?fecha=YYYY-MM-DD` | solo admin | Cuadre de todos los vendedores del negocio, un día dado |

## 8. Cómo verificar que el aislamiento funciona de verdad

1. Registra dos negocios distintos (dos llamadas a `/auth/registro-negocio`).
2. Con el token del negocio A, crea un cliente.
3. Con el token del negocio B, llama a `GET /clientes`.
4. El negocio B **no debe ver** el cliente del negocio A — ni aunque haya un bug
   en el código, porque la base de datos lo bloquea a nivel de fila (RLS).

## 9. Próximos pasos sugeridos

Cada uno sigue exactamente el mismo patrón que `clientes`, `abonos` y `caja`
(un service con `withTenant`, un controller, un module):

1. Job de mora (cron diario que revisa `fechaVencimiento` vs abonos).
2. Renovación de créditos.
3. Enrutamiento y clientes ausentes.
4. Notificaciones push (Firebase).
5. PIN / bloqueo de la app.
