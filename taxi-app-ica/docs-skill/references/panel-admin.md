# Panel de Administración ("Mi Hub") — Detalle de Módulos y Funciones

Es el centro de control del negocio, usado por el equipo operativo/dueño, no por pasajeros ni conductores.

## Módulos

### 1. Gestión de Flota y Conductores
- Lista de conductores con estado (pendiente de verificación, activo, suspendido).
- Revisión y aprobación/rechazo de documentos subidos (licencia, SOAT, tarjeta de propiedad).
- Ficha de conductor: historial de viajes, calificación, comisión asignada, notas internas.
- Suspender/reactivar conductores.

### 2. Tarifas Dinámicas y Promociones
- Definir tarifa base, costo por km, costo por minuto.
- Multiplicadores por zona o por demanda (horas pico).
- Crear promociones: código de descuento, tipo (nuevo usuario, promo semanal, referido), vigencia, tope de usos.

### 3. Monitoreo en Tiempo Real
- Mapa con todos los viajes activos (posición de conductores y pasajeros en curso).
- Filtros por zona, estado del viaje, conductor.
- Alertas cuando se activa un botón de pánico (prioridad máxima, debe destacar visualmente y sonar).

### 4. Reportes y Analítica
- Viajes por día/semana/mes.
- Ingresos totales y por conductor.
- Tiempo promedio de espera y de viaje.
- Tasa de aceptación/cancelación por conductor.
- Exportable a Excel/CSV (usar skill xlsx cuando se pida el archivo).

### 5. Soporte y Atención
- Bandeja de incidencias reportadas por pasajeros/conductores.
- Estado de cada ticket (abierto, en proceso, resuelto).

### 6. Configuración General
- Datos de la empresa, zonas de cobertura habilitadas en Ica, comisión por defecto de la plataforma.

## Roles internos sugeridos
- **Admin (dueño):** acceso total.
- **Operador:** gestión de conductores y monitoreo, sin acceso a configuración financiera.
- **Soporte:** solo bandeja de incidencias.

## Notas
- El monitoreo en tiempo real y las alertas de pánico son la función de mayor prioridad técnica: deben tener la menor latencia posible (usar listeners de Firestore en tiempo real, no polling).
- Los reportes deben poder filtrarse por rango de fechas y exportarse; es lo primero que pedirá el dueño del negocio para tomar decisiones.
