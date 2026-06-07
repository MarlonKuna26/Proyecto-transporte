# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY packages/backend packages/backend
COPY packages/shared packages/shared
# Ensure all dependencies are available in the workspace
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @u-ride/backend build

FROM node:20-alpine AS runtime
WORKDIR /app/packages/backend
ENV NODE_ENV=production
ENV PORT=3002

RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build --chown=app:app /app/packages/backend/node_modules ./node_modules
COPY --from=build --chown=app:app /app/packages/backend/package.json ./package.json
COPY --from=build --chown=app:app /app/packages/backend/dist ./dist

USER app
EXPOSE 3002
CMD ["node", "dist/main.js"]