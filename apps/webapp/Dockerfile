# Build stage
FROM oven/bun:latest AS builder

WORKDIR /build

COPY ./apps/webapp/src ./apps/webapp/src
COPY ./apps/webapp/package.json ./apps/webapp/package.json
COPY ./apps/webapp/tsconfig.json ./apps/webapp/tsconfig.json
COPY ./apps/webapp/bun-env.d.ts ./apps/webapp/bun-env.d.ts
COPY ./apps/webapp/build.ts ./apps/webapp/build.ts
COPY ./apps/webapp/env.ts ./apps/webapp/env.ts

COPY ./packages/clients/src ./packages/clients/src
COPY ./packages/clients/package.json ./packages/clients/package.json
COPY ./packages/clients/tsconfig.json ./packages/clients/tsconfig.json

COPY ./packages/decorators/src ./packages/decorators/src
COPY ./packages/decorators/package.json ./packages/decorators/package.json
COPY ./packages/decorators/tsconfig.json ./packages/decorators/tsconfig.json

COPY ./packages/dzui/src ./packages/dzui/src
COPY ./packages/dzui/i18n ./packages/dzui/i18n
COPY ./packages/dzui/package.json ./packages/dzui/package.json
COPY ./packages/dzui/tsconfig.json ./packages/dzui/tsconfig.json
COPY ./packages/dzui/bun-env.d.ts ./packages/dzui/bun-env.d.ts

COPY ./packages/hono/src ./packages/hono/src
COPY ./packages/hono/package.json ./packages/hono/package.json
COPY ./packages/hono/tsconfig.json ./packages/hono/tsconfig.json

COPY ./packages/zod/src ./packages/zod/src
COPY ./packages/zod/package.json ./packages/zod/package.json
COPY ./packages/zod/tsconfig.json ./packages/zod/tsconfig.json

COPY ./packages/dz-config/src ./packages/dz-config/src
COPY ./packages/dz-config/package.json ./packages/dz-config/package.json
COPY ./packages/dz-config/tsconfig.json ./packages/dz-config/tsconfig.json

COPY ./package.json ./package.json
COPY ./bun.lock ./bun.lock
COPY ./bunfig.toml ./bunfig.toml
COPY ./.env.prod ./.env.prod

# Install dependencies and build
RUN bun install
RUN bun run webapp:build

# Runtime stage
FROM debian:stable-slim

# Copy the built binary from builder
COPY --from=builder /build/apps/webapp/dist/app /usr/bin/application
COPY ./apps/webapp/log4js.prod.yaml /root/log4js.yaml

EXPOSE 3000

RUN chmod +x /usr/bin/application

WORKDIR /root

CMD ["application"]
