# Build stage
FROM oven/bun:latest AS builder

WORKDIR /build

# Copy the entire workspace ignoring files specified in .dockerignore
COPY . .

# Install dependencies and build
RUN bun install --frozen-lockfile
RUN bun run build:webapp

# Runtime stage
FROM debian:stable-slim

# Copy the built binary from builder
COPY --from=builder /build/apps/webapp/dist/app /usr/bin/application
COPY --from=builder /build/apps/webapp/log4js.yaml /root/log4js.yaml

EXPOSE 3000

RUN chmod +x /usr/bin/application

WORKDIR /root

CMD ["application"]
