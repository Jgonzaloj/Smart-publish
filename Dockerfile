# Dockerfile multi-etapa optimizado para producción de CrediYa SaaS
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias para compilar módulos nativos si son necesarios
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar dependencias completas
RUN npm ci --legacy-peer-deps

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente y compilar
COPY src ./src
COPY public ./public
RUN npm run build

# ==========================================
# Etapa de Producción (ligera y segura)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Crear usuario sin privilegios root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copiar artefactos compilados y frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Asignar permisos al usuario app
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
