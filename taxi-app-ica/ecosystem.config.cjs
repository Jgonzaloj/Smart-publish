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
        DOMAIN: 'apptaxi.inversionesvawi.com',
        ADMIN_USER: 'admin',
        ADMIN_PASS: 'admin2026!'
      }
    }
  ]
};
