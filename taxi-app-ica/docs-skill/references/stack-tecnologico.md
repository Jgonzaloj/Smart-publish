# Stack Tecnológico y Arquitectura — App de Taxi Ica

Estas decisiones ya están tomadas. No las vuelvas a preguntar; si el usuario pide algo distinto, adáptate pero deja constancia del cambio.

## Apps móviles (Pasajero y Conductor)
- **Framework:** Flutter (Dart) — un solo código base para iOS y Android, ideal para MVP con presupuesto y equipo reducido.
- **Mapas y geolocalización:** Google Maps Platform (Maps SDK, Directions API, Distance Matrix API, Geolocation).
- **Notificaciones push:** Firebase Cloud Messaging (FCM).

## Backend
- **Base de datos y autenticación:** Firebase (Authentication con teléfono/correo, Firestore como base de datos NoSQL en tiempo real, Cloud Storage para documentos de conductores).
- **Lógica de negocio (asignación de conductor, cálculo de tarifa, triggers):** Firebase Cloud Functions (Node.js/TypeScript).
- **Alternativa si el proyecto crece:** API intermedia en Node.js + PostgreSQL/PostGIS para lógica geoespacial más compleja y reportes avanzados, manteniendo Firebase solo para auth/notificaciones en tiempo real.

## Panel de Administración
- **Frontend:** React (web app), consumiendo Firestore directamente (con reglas de seguridad por rol) o la API intermedia si existe.
- **Visualización de mapa en tiempo real:** Google Maps JavaScript API + listeners de Firestore en tiempo real.

## Pagos
- Efectivo (por defecto, imprescindible en el mercado peruano).
- Yape (vía QR o integración con Yape Empresas/API de agregador de pagos como Culqi/Niubiz que soporte Yape).
- Billetera interna (saldo prepagado dentro de la app) como opción a mediano plazo.

## Modelo de datos sugerido (colecciones Firestore)
- `usuarios` — pasajeros: datos personales, métodos de pago, historial.
- `conductores` — datos personales, estado de verificación, documentos (licencia, SOAT, tarjeta de propiedad), calificación promedio.
- `vehiculos` — placa, modelo, año, foto, asociado a un conductor.
- `viajes` — origen, destino, estado, conductor asignado, tarifa, timestamps, ruta.
- `tarifas` — tarifa base, costo por km, costo por minuto, multiplicadores por demanda/zona.
- `calificaciones` — viaje, calificador, calificado, puntaje, comentario.
- `pagos` — viaje, método, monto, estado.
- `promociones` — código, tipo (nuevo usuario, semanal), descuento, vigencia.

## Seguridad de datos
- Reglas de Firestore por rol: un pasajero solo lee/escribe sus propios documentos; un conductor solo los suyos y los viajes que tiene asignados; el admin tiene acceso amplio vía Cloud Functions con verificación de custom claims (`role: admin`).
- Documentos sensibles de conductor (licencia, antecedentes) en Cloud Storage con reglas restrictivas, accesibles solo por el propio conductor y el admin.
