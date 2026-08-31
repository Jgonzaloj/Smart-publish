module.exports = {
  apps: [
    {
      name: 'taxi-app-ica',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DOMAIN: 'apptaxi.inversionesvawi.com'
        // NOTA DE SEGURIDAD:
        // Las credenciales de ADMIN_PASS y JWT_SECRET se leen desde las variables de entorno
        // del sistema del servidor o archivo .env privado, nunca se almacenan en texto plano en este archivo.
      }
    }
  ]
};
