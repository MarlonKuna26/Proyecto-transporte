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
RUN pnpm --filter @u-ride/backend build
RUN pnpm prune --prod

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002

RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=build --chown=app:app /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=build --chown=app:app /app/packages/backend/dist ./packages/backend/dist

USER app
EXPOSE 3002
CMD ["node", "packages/backend/dist/main.js"]
