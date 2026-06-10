FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# Ejecutar pruebas (si falla, no se construye la imagen)
RUN pnpm --filter @u-ride/frontend run test

# Construir el frontend
RUN pnpm --filter @u-ride/frontend build

# Imagen de producción (Nginx)
FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
