# Build stage
FROM oven/bun:latest AS builder

WORKDIR /build

# Copy the entire workspace ignoring files specified in .dockerignore
COPY . .

# Install dependencies and build
RUN bun install --frozen-lockfile
RUN bun run daemon:build
RUN bun run webapp:build

# Runtime stage
FROM debian:stable-slim

# Copy the built binary from builder
COPY --from=builder /build/apps/webapp/dist/app /usr/bin/application
COPY --from=builder /build/apps/webapp/log4js.prod.yaml /root/log4js.yaml
COPY --from=builder /build/apps/daemon/dist/dcs-dropzone-daemon.tar /root/dcs-dropzone-daemon.tar

EXPOSE 3000

RUN chmod +x /usr/bin/application

WORKDIR /root

CMD ["application"]
