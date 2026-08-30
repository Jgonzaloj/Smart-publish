# App Pasajero — Detalle de Pantallas y Funciones

## Pantallas (en orden de flujo típico)
1. **Splash / Onboarding** — logo, 2-3 slides de valor (rapidez, seguridad, pago flexible).
2. **Registro/Login** — por teléfono (OTP vía Firebase Auth) o correo. Pedir nombre y foto opcional.
3. **Home / Mapa** — mapa centrado en ubicación actual (geolocalización), buscador de destino, botón "Pedir viaje".
4. **Selección de origen/destino** — autocompletado de direcciones (Places API), ajuste manual del pin.
5. **Cotización/Negociación de tarifa** (opcional, estilo inDrive) — mostrar tarifa sugerida por el sistema; permitir al usuario proponer un monto distinto y esperar que un conductor lo acepte.
6. **Buscando conductor** — animación/estado mientras el sistema asigna al conductor disponible más cercano.
7. **Conductor asignado** — foto, nombre, modelo y placa del vehículo, calificación, tiempo estimado de llegada, botón de llamada/chat.
8. **Viaje en curso** — seguimiento GPS en tiempo real del vehículo, ETA al destino, botón de pánico visible.
9. **Fin de viaje / Pago** — resumen de tarifa, selección de método de pago (efectivo, Yape, billetera), confirmación.
10. **Calificación** — puntaje 1-5 y comentario opcional sobre el conductor.
11. **Historial de viajes** — lista de viajes pasados con detalle y recibo.
12. **Perfil** — datos personales, métodos de pago guardados, contactos de confianza para compartir ubicación.
13. **Soporte** — chat o formulario de incidencias dentro de la app.

## Funciones transversales
- Geolocalización en tiempo real.
- Métodos de pago múltiples (efectivo, Yape, billetera).
- Botón de pánico (envía alerta con ubicación a un contacto/central).
- Compartir ubicación del viaje en tiempo real con un contacto de confianza.
- Notificaciones push (conductor asignado, conductor llegó, viaje iniciado/finalizado, promociones).
- Códigos de promoción (nuevo usuario, promo semanal).

## Notas de UX específicas para Ica
- No asumir que todos tienen tarjeta de crédito/débito: efectivo y Yape deben estar igual de visibles que cualquier billetera in-app.
- Mostrar siempre placa y foto del conductor antes de abordar — es un punto de seguridad muy valorado localmente.
- Mantener el flujo de pedir viaje en máximo 3 toques desde el Home.
