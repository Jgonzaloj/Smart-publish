# 🚀 Guía de Despliegue en Servidor y Subdominio (Node.js + Playwright)

Esta guía te explica paso a paso lo necesario para publicar el Agente de Prospección B2B en tu subdominio (ej: `agente.tudominio.com` o `crm.tudominio.com`).

---

## 📋 Resumen de Requisitos Previos

1. **Un Servidor VPS o Hosting con soporte Node.js** (Ubuntu 22.04 / 24.04 recomendado en Hetzner, DigitalOcean, AWS, Linode, o paneles como CloudPanel/cPanel con terminal SSH).
2. **Tu Subdominio configurado en tu DNS** (Registro `A` apuntando a la IP pública de tu servidor).
3. **Node.js v20+ o Docker** instalado en el servidor.

---

## 🛠️ Opción A: Despliegue Directo con PM2 y Nginx (Recomendado)

### 1. Conectar tu Subdominio (DNS)
En tu proveedor de dominio (Cloudflare, Namecheap, GoDaddy, etc.):
- Crea un registro tipo **A**:
  - **Nombre / Host:** `agente` (o el subdominio que elijas)
  - **Valor / IP:** La dirección IP de tu VPS
  - **TTL:** Automático o 5 min

---

### 2. Subir el Proyecto al Servidor
En tu servidor Linux vía SSH:
```bash
# Crear directorio
mkdir -p /var/www/agente-prospeccion
cd /var/www/agente-prospeccion

# Subir los archivos del proyecto (vía git clone o rsync/scp o FTP)
# Instalar dependencias
npm install

# Instalar Chromium y dependencias del sistema operativo para Playwright
npx playwright install --with-deps chromium
```

---

### 3. Configurar `.env` para Producción y Seguridad
Copia `.env.example` o crea `.env` con tus datos:
```bash
nano .env
```
Contenido clave para producción:
```env
USE_MOCK_MODE=false
PORT=3000

# Protección del Dashboard con Usuario y Contraseña
ADMIN_USER=admin
ADMIN_PASSWORD=TuPasswordSeguro2026!

# Claves de APIs
GOOGLE_PLACES_API_KEY=tu_api_key_aqui
GEMINI_API_KEY=tu_api_key_aqui
WHATSAPP_API_TOKEN=tu_token_meta_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id_aqui
WHATSAPP_WEBHOOK_VERIFY_TOKEN=token_seguro_para_webhook

# Email & Notificaciones al Cerrador Comercial
RESEND_API_KEY=tu_resend_api_key
CLOSER_NOTIFICATION_EMAIL=tu_correo_personal_o_ventas@empresa.com
CLOSER_NOTIFICATION_PHONE=51999999999
```

---

### 4. Iniciar la Aplicación 24/7 con PM2
Instala y arranca PM2 para que el servicio nunca se detenga y se reinicie ante caídas o reinicios del servidor:
```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Para ver el estado o logs en cualquier momento:
```bash
pm2 status
pm2 logs agente-prospeccion-b2b
```

---

### 5. Configurar Nginx y Certificado SSL Gratuito (HTTPS)

1. Crear el archivo de sitio en Nginx:
```bash
sudo nano /etc/nginx/sites-available/agente.tudominio.com
```
Pega la configuración:
```nginx
server {
    listen 80;
    server_name agente.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
    }
}
```

2. Activar el sitio y reiniciar Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/agente.tudominio.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. Obtener SSL gratis con Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d agente.tudominio.com
```

---

## 🐳 Opción B: Despliegue con Docker (1 Solo Comando)

Si tu servidor tiene Docker y Docker Compose:
```bash
# 1. Configurar tu .env
# 2. Levantar el contenedor
docker compose up -d --build
```
El contenedor ya incluye todas las librerías nativas de Linux y Playwright Chromium sin necesidad de configurar nada más en el host.

---

## 📲 Configuración del Webhook de WhatsApp en Meta Developer Portal

Para que cuando un prospecto responda por WhatsApp, el agente cambie automáticamente su estado a `HUMAN_HANDOFF`:
1. Ve a [developers.facebook.com](https://developers.facebook.com) $\rightarrow$ Tu App $\rightarrow$ WhatsApp $\rightarrow$ Configuration.
2. En **Callback URL**: `https://agente.tudominio.com/api/webhooks/whatsapp`
3. En **Verify Token**: El valor que pusiste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en tu `.env`.
4. Suscríbete al evento `messages`.
