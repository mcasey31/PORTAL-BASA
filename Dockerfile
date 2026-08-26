# ================================================
# Dockerfile - VitalFlow Portal
# Next.js Patient-Facing PWA
# ================================================

FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma

# Instalar todas las dependencias
RUN npm install

# ================================================
# Builder stage
# ================================================
FROM node:20-alpine AS builder

ARG NODE_ENV=development
ENV SKIP_ENV_VALIDATION=1

WORKDIR /app

# Copiar node_modules del stage anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar source code
COPY . .

# Build Next.js app
RUN npm run build

# ================================================
# Runtime stage
# ================================================
FROM node:20-alpine

ARG NODE_ENV=production

WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma

# Instalar solo dependencias de producción
RUN npm install --omit=dev && \
    npm cache clean --force

# Copiar la app compilada
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
