// ==============================================================================
// ENTRY POINT OFICIAL PARA CPANEL / HOSTING / PRODUCCIÓN
// Dominio: https://apptaxi.inversionesvawi.com
// ==============================================================================

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || 4000;
process.env.DOMAIN = process.env.DOMAIN || 'apptaxi.inversionesvawi.com';

// Importar aplicación compilada
import('./dist/server/app.js').catch((err) => {
  console.error('Error iniciando la aplicación de Taxi Ica:', err);
});
