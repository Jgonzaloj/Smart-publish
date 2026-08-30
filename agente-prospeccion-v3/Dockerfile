# Usar imagen oficial de Playwright con Node.js y todas las dependencias de Chromium preinstaladas
FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente y assets
COPY . .

# Asegurar directorios de almacenamiento
RUN mkdir -p storage/screenshots

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Comando de inicio
CMD ["npx", "tsx", "src/server/index.ts"]
