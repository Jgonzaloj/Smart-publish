# Usamos la versión LTS ligera de Node
FROM node:20-alpine

# Instalamos dependencias necesarias para compilar librerías nativas (como bcrypt, sharp)
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código y compilar TypeScript
COPY . .
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# En Producción usamos el código compilado (JS) en lugar de ts-node
CMD ["npm", "start"]
