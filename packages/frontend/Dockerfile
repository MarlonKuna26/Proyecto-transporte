# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

ARG VITE_API_URL=http://localhost:3002/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY packages/frontend packages/frontend
COPY packages/shared packages/shared
RUN pnpm --filter @u-ride/frontend build

FROM nginx:1.27-alpine AS runtime
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
