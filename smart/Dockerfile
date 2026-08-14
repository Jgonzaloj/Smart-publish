# FASE 1: Build (Compilación de React)
FROM node:20-alpine as build
WORKDIR /app

# Copiar dependencias (aprovechando caché de capas Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# FASE 2: Servir (NGINX)
FROM nginx:alpine
# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos de Vite a la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
