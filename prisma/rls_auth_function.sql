-- =====================================================================
-- CORRECCIÓN hallazgo crítico 1.3: login imposible con RLS estricto activo
-- =====================================================================
-- Problema: las políticas de rls_policies.sql exigen que la sesión ya sepa
-- el tenant_id (`current_setting('app.tenant_id')`) para poder leer CUALQUIER
-- fila de `usuarios`. Pero en el login todavía no sabemos a qué empresa
-- pertenece el usuario (solo tenemos su email) - es una dependencia circular.
-- Con un rol de aplicación NOBYPASSRLS (como se recomienda en rls_policies.sql),
-- esa consulta de login devolvería siempre 0 filas y el login nunca funcionaría.
--
-- Solución: una única función SQL marcada SECURITY DEFINER. Este tipo de
-- función se ejecuta con los privilegios de quien la CREÓ (normalmente el
-- dueño de las tablas / rol de migraciones), no con los del rol restringido
-- que usa la aplicación. Como el dueño de la tabla NO tiene RLS forzado por
-- defecto, esta función SÍ puede leer usuarios de cualquier tenant - pero
-- solo devuelve las columnas mínimas necesarias para autenticar (nunca
-- datos de clientes, créditos, ni el pin_hash). Esta es la ÚNICA puerta de
-- acceso cross-tenant que existe en todo el sistema, y está acotada a esto.
--
-- Ejecutar este archivo con el MISMO rol que corrió rls_policies.sql
-- (el dueño de las tablas / rol de migraciones), nunca con app_user.
-- =====================================================================

CREATE OR REPLACE FUNCTION buscar_credenciales_login(p_email text)
RETURNS TABLE (
  id text,
  tenant_id text,
  password_hash text,
  rol text,
  nombre text,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, password_hash, rol::text, nombre, activo
  FROM usuarios
  WHERE email = p_email
  LIMIT 1;
$$;

-- Solo el rol de aplicación puede ejecutar esta función (no leer la tabla
-- completa, solo llamar a esta función puntual).
GRANT EXECUTE ON FUNCTION buscar_credenciales_login(text) TO app_user;

-- IMPORTANTE: revisa que app_user exista y sea NOBYPASSRLS (ver el paso 3 al
-- final de rls_policies.sql). Si tu rol de aplicación tiene otro nombre,
-- reemplaza "app_user" arriba por el nombre correcto antes de ejecutar esto.
