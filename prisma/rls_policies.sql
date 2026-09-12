-- =====================================================================
-- Row Level Security (RLS): aislamiento de datos por empresa (tenant)
-- =====================================================================
-- Idea: cada conexión a la base de datos "declara" para qué tenant_id
-- está trabajando (lo hace el backend en cada request, ver TenantGuard).
-- Postgres entonces bloquea automáticamente cualquier fila que no
-- pertenezca a ese tenant_id, sin importar si el código del backend
-- tiene un bug y olvida filtrar. Esta es la última línea de defensa.
--
-- Ejecutar DESPUÉS de correr `prisma migrate dev` (las tablas ya deben existir).
-- =====================================================================

-- 1. Activar RLS en cada tabla que tiene tenant_id
ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_credito     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE codeudores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguros               ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadres_caja          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas                 ENABLE ROW LEVEL SECURITY;

-- 2. Política: cada tabla solo permite ver/editar filas donde
--    tenant_id coincide con el valor que el backend declaró en la sesión
--    (current_setting('app.tenant_id')). Si el backend no lo declara,
--    la comparación falla y no se ve NADA (falla cerrado, no abierto).

CREATE POLICY tenant_isolation_usuarios ON usuarios
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_productos_credito ON productos_credito
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_clientes ON clientes
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_codeudores ON codeudores
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_creditos ON creditos
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_seguros ON seguros
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_abonos ON abonos
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_movimientos_caja ON movimientos_caja
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_cuadres_caja ON cuadres_caja
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_rutas ON rutas
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- 3. IMPORTANTE: el usuario de base de datos que usa la app NO debe ser
--    "superuser" ni el dueño de las tablas (BYPASSRLS), porque esos roles
--    se saltan el RLS automáticamente. Crear un rol de aplicación aparte:
--
--    CREATE ROLE app_user WITH LOGIN PASSWORD 'cambia-esto' NOBYPASSRLS;
--    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
--    -- y usar ese usuario (no el de las migraciones) en DATABASE_URL de producción
