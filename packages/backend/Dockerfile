FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copiar todo el código (node_modules es ignorado por .dockerignore)
COPY . .

# Instalar dependencias del monorepo
RUN pnpm install --frozen-lockfile

# Las pruebas se ejecutan en el pipeline de Jenkins para extraer el coverage

# Construir el backend
RUN pnpm --filter @u-ride/backend build

# Imagen de producción
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias y build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

WORKDIR /app/packages/backend

# Exponer el puerto del backend
EXPOSE 3002

CMD ["npm", "start"]
