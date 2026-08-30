# App Conductor — Detalle de Pantallas y Funciones

## Pantallas (en orden de flujo típico)
1. **Splash / Onboarding**
2. **Registro** — datos personales, número de teléfono (OTP), correo.
3. **Verificación de documentos** — subida de foto/PDF de: licencia de conducir, SOAT, tarjeta de propiedad del vehículo, foto del vehículo (placa visible), antecedentes penales (si aplica). Estado: "en revisión" hasta que el admin lo apruebe.
4. **Datos del vehículo** — marca, modelo, año, color, placa.
5. **Home / Disponibilidad** — switch "En línea / Fuera de línea", mapa con la posición actual.
6. **Solicitud entrante** — notificación con origen, destino aproximado, tarifa/oferta del pasajero, botón aceptar/rechazar (con temporizador corto).
7. **Navegación al pasajero** — ruta al punto de recojo (Directions API), botón "Llegué".
8. **Viaje en curso** — ruta al destino, botón "Finalizar viaje", botón de pánico.
9. **Resumen de viaje** — monto a cobrar, método de pago usado, confirmación de cobro (si es efectivo, el conductor confirma que recibió el pago).
10. **Calificación al pasajero**.
11. **Billetera/Ganancias** — resumen diario/semanal, comisión de la plataforma descontada, historial de pagos, botón de retiro (si aplica billetera).
12. **Perfil** — documentos, calificación promedio, estado de la cuenta.
13. **Soporte**.

## Funciones transversales
- Verificación de identidad y documentos (obligatoria antes de poder recibir viajes).
- Recepción de solicitudes con tarifa negociable (aceptar tarifa sugerida u oferta del pasajero).
- Navegación GPS turn-by-turn.
- Registro de ganancias y comisión de la plataforma.
- Botón de pánico.
- Notificaciones push de nuevas solicitudes, incluso con la app en segundo plano.

## Notas de UX específicas para Ica
- El flujo de verificación de documentos debe ser simple (foto con celular, no exigir escaneo profesional) porque muchos conductores no tendrán acceso a un scanner.
- Mostrar de forma muy clara la comisión que cobra la plataforma por viaje, para generar confianza y evitar reclamos.
- Considerar modo "solo efectivo" para conductores que no quieran o no puedan usar Yape al inicio.
