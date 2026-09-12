# Auditoría Técnica y de Arquitectura Senior: Backend de Créditos Multi-Tenant

**Fecha:** Septiembre 2026  
**Proyecto:** Sistema de Créditos Personales Multi-Tenant (Gota a Gota / Microcréditos)  
**Stack:** NestJS 10, TypeScript 5, Prisma ORM 5, PostgreSQL con Row Level Security (RLS), Playwright Test Runner  
**Autor:** Antigravity Senior Principal Architect  

---

## 1. Resumen Ejecutivo

Se auditó e implementó la lógica nuclear del negocio para los dos componentes más críticos de la operación diaria de cobro:
1. **Mora Automática Determinista (`MoraModule`):** Cálculo automatizado de cuotas atrasadas según periodicidad (`diario`, `semanal`, `quincenal`, `mensual`), con transiciones automáticas bidireccionales (`ACTIVO` $\leftrightarrow$ `EN_MORA`, `AL_DIA` $\leftrightarrow$ `ATRASADO`), ejecución programada a medianoche vía `@Cron` y sincronización en tiempo real al abonar.
2. **Hoja de Ruta Diaria y Clientes Ausentes (`RutasModule`):** Gestión de visitas diarias para vendedores con orden configurable persistido en Postgres (`Ruta.ordenVisitas`), métricas consolidadas en vivo (recaudado hoy, esperado, pendientes, ausentes), marcado atómico de ausencia y auto-reset al iniciar un nuevo día.
3. **Suite Automatizada de Pruebas con Playwright:** 15 pruebas de extremo a extremo y de lógica de negocio ejecutadas y aprobadas al 100%.

---

## 2. Auditoría de Seguridad y Aislamiento Multi-Tenant

### 2.1 Aislamiento a Nivel de Motor de Base de Datos (PostgreSQL RLS)
- **Mecanismo:** Cada consulta que toca datos sensibles se ejecuta mediante el wrapper `PrismaService.withTenant(tenantId, tx)`.
- **Mitigación de SQL Injection:** Se implementó una expresión regular estricta (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) antes de llamar a `SET LOCAL app.tenant_id = '...'`. Se verificó en prueba automatizada que cualquier intento de inyección de comillas, comandos SQL o cadenas no-UUID es interceptado y abortado con excepción.
- **Falla Cerrada (*Fail-Closed*):** Las políticas en `prisma/rls_policies.sql` usan `current_setting('app.tenant_id', true)::uuid`. Si una sesión no define el parámetro, la comparación resulta nula y Postgres devuelve cero registros, garantizando que un error en el código nunca exponga datos de otra empresa.

### 2.2 Control de Acceso Basado en Roles (RBAC) y Escalación Horizontal
- **Separación de Roles:** Se aplican guards `JwtAuthGuard` y `@Roles('ADMIN')` en endpoints sensibles como `/mora/ejecutar` y `/caja/cuadre/resumen-admin`.
- **Defensa en Profundidad para Vendedores:** Aunque la RLS aísla por `tenant_id`, en la capa de aplicación los servicios `ClientesService`, `RutasService` y `AbonosService` verifican que si el usuario tiene rol `VENDEDOR`, el recurso pertenezca exclusivamente a `user.sub` (`vendedorId`). Un vendedor no puede cobrar ni marcar ausente a un cliente de otro cobrador del mismo negocio.

---

## 3. Auditoría de Consistencia Financiera y Reglas de Negocio

### 3.1 Algoritmo de Mora y Cuotas Atrasadas
- **Fórmula de Tiempo Transcurrido:**
  $$\text{días} = \lfloor(\text{fechaRef} - \text{fechaInicio}) / 86400000\rfloor$$
  $$\text{cuotasEsperadas} = \min(\text{cuotasTranscurridas}, \text{numeroCuotasTotal})$$
  $$\text{cuotasAtrasadas} = \max(0, \text{cuotasEsperadas} - \text{cuotasPagadas})$$
- **Vencimiento Absoluto:** Si $\text{fechaRef} > \text{fechaVencimiento}$ y $\text{saldoActual} > 0$, el crédito pasa forzosamente a `EN_MORA` y las cuotas atrasadas reflejan la totalidad pendiente.
- **Transición Bidireccional:** A diferencia de sistemas primitivos donde un crédito en mora requiere intervención manual para salir de ella, cuando un cliente abona el valor adeudado y se pone al día, el crédito regresa de inmediato a `ACTIVO` y el cliente a `AL_DIA`.

### 3.2 Hoja de Ruta Diaria (`GET /rutas/hoy`)
- **Problema Operativo Resuelto:** Los cobradores no tienen que buscar cliente por cliente. La hoja de ruta entrega:
  1. Clientes ordenados por la secuencia geográfica o de cobranza guardada en `Ruta.ordenVisitas`.
  2. Detección instantánea de pago en el día actual (`haPagadoHoy`, `totalAbonadoHoy`).
  3. Cálculo de métricas agregadas en memoria y en una sola consulta relacional optimizada.
- **Ciclo de Vida de Ausentes:** El estado `AUSENTE` es estrictamente del día operativo. El cron job de medianoche y la carga de ruta diaria resetean la ausencia para que al amanecer el cobrador vuelva a tener al cliente en lista de visita activa (clasificado según su mora real).

---

## 4. Resultados de Pruebas Automatizadas con Playwright

Ejecución del comando `npm run test:e2e`:

| # | Archivo de Prueba | Caso Verificado | Estado |
|---|---|---|---|
| 1 | `tests/abonos-mora.spec.ts` | Al abonar y quedar al día, crédito $\rightarrow$ `ACTIVO` y cliente $\rightarrow$ `AL_DIA` | PASÓ |
| 2 | `tests/abonos-mora.spec.ts` | Abono que liquida saldo total $\rightarrow$ `PAGADO` y cuotas atrasadas 0 | PASÓ |
| 3 | `tests/abonos-mora.spec.ts` | Rechazo de abonos mayores al saldo pendiente del crédito | PASÓ |
| 4 | `tests/isolation-rls.spec.ts` | Rechazo de inyección SQL en `tenantId` antes de `SET LOCAL` | PASÓ |
| 5 | `tests/isolation-rls.spec.ts` | Generación correcta de `SET LOCAL app.tenant_id = 'UUID'` | PASÓ |
| 6 | `tests/mora.spec.ts` | Periodicidad DIARIO: Cuotas atrasadas calculadas con exactitud | PASÓ |
| 7 | `tests/mora.spec.ts` | Periodicidad DIARIO: Cliente adelantado o al día mantiene `ACTIVO` | PASÓ |
| 8 | `tests/mora.spec.ts` | Periodicidad SEMANAL: Múltiplos de 7 días evaluados | PASÓ |
| 9 | `tests/mora.spec.ts` | Periodicidad QUINCENAL: Múltiplos de 15 días evaluados | PASÓ |
| 10 | `tests/mora.spec.ts` | Crédito con fecha de vencimiento superada entra en mora obligatorio | PASÓ |
| 11 | `tests/mora.spec.ts` | Ejecución masiva para tenant actualiza créditos y clientes | PASÓ |
| 12 | `tests/rutas.spec.ts` | `obtenerRutaHoy` entrega orden personalizado y métricas de cobro | PASÓ |
| 13 | `tests/rutas.spec.ts` | `marcarAusente` actualiza atómicamente a `AUSENTE` | PASÓ |
| 14 | `tests/rutas.spec.ts` | `marcarAusente` bloquea intentos sobre clientes de otro vendedor | PASÓ |
| 15 | `tests/rutas.spec.ts` | `guardarOrdenRuta` valida pertenencia al tenant y persiste JSON | PASÓ |

**Resultado consolidado:** `15 passed (1.9s)`.

---

## 5. Recomendaciones Senior para Producción

1. **Usuario de Postgres sin BYPASSRLS:**  
   Asegurarse de que en producción la variable `DATABASE_URL` conecte con un rol que tenga la cláusula `NOBYPASSRLS`, ya que el superusuario de Postgres omite las políticas de seguridad de filas por diseño.
2. **Índices en Base de Datos:**  
   Para rutas con miles de clientes, los índices existentes en `schema.prisma` (`[tenantId, vendedorId]`, `[tenantId, creditoId]`) son adecuados y ofrecen tiempos de respuesta en milisegundos.
3. **Zona Horaria del Servidor:**  
   Configurar la variable de entorno `TZ=America/Bogota` (o la zona horaria de operación) en el host/contenedor para que el cron job de medianoche corra en la medianoche local del negocio.
