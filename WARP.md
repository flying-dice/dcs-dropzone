# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Install deps

```bash path=null start=null
bun install
```

- Dev servers
  - Web application (serves React SPA + Hono API on PORT):

```bash path=null start=null
bun run dev
```

  - Daemon API (reads config.toml for host/port):

```bash path=null start=null
bun run dev:daemon
```

- Build (produces native binaries in dist/)

```bash path=null start=null
bun run build        # web application -> dist/application
bun run build:daemon # daemon  -> dist/appd
```

- Run via Docker Compose (application + MongoDB)

```bash path=null start=null
bun run start
```

- Lint/format with Biome

```bash path=null start=null
bun run biome
```

- API client generation (orval)
  - Local API (requires web application running to serve /v3/api-docs):

```bash path=null start=null
bun run orval
```

- Drizzle SQL migrations (daemon)
  - Generate SQL from schema.ts into src/daemon/database/ddl/ then bundle to index-ddl.ts used at runtime:

```bash path=null start=null
bun run drizzle       # runs: drizzle-kit generate --config drizzle.config.ts --name=init
bun run postdrizzle   # builds src/daemon/database/index-ddl.ts
```

- Tests: none configured in package.json (no test runner present).

## Environment & config

- Web application (src/application)
  - Required env vars (see src/application/server/ApplicationConfig.ts and src/application/server/ApplicationContext.ts):
    - PORT, LOG_LEVEL, JWT_SECRET, SESSION_COOKIE_NAME (optional, default JSESSIONID), GH_CLIENT_ID, GH_CLIENT_SECRET, GH_AUTHORIZATION_CALLBACK_URL, GH_HOMEPAGE_URL, MONGODB_URI
  - Example (replace placeholders):

```bash path=null start=null
export PORT=3000
export LOG_LEVEL=info
export JWT_SECRET={{JWT_SECRET}}
export SESSION_COOKIE_NAME=JSESSIONID
export GH_CLIENT_ID={{GH_CLIENT_ID}}
export GH_CLIENT_SECRET={{GH_CLIENT_SECRET}}
export GH_AUTHORIZATION_CALLBACK_URL=http://localhost:3000/auth/github/callback
export GH_HOMEPAGE_URL=http://localhost:3000/
export MONGODB_URI="mongodb://localhost:27017"
```

- Daemon (src/daemon)
  - Reads TOML config at runtime: `${cwd}/config.toml` (see src/daemon/ApplicationConfig.ts)
  - Minimal example:

```toml path=null start=null
[server]
host = "127.0.0.1"
port = 4000

[logging]
level = "info"
colorize = true
# destination can be a file path or 1 for stdout
# destination = 1

[database]
url = "/tmp/dcs-dropzone.sqlite"
```

## High-level architecture

- Runtime(s)
  - Web application (src/application)
    - Entrypoint: src/application/ApplicationContext.ts (Bun.serve)
      - Serves client HTML for "/*"
      - Proxies API routes to Hono application: /auth, /api, /v3/api-docs
    - API: src/application/server/Application.ts (Hono)
      - Middleware: CORS, requestId, structured request logging (pino via loggerMiddleware)
      - Routes:
        - /auth: OAuth login/redirect/user/logout (see services below)
        - /api/health: Mongo connectivity check
        - /v3/api-docs + /api: OpenAPI JSON + Scalar UI
    - Services
      - Auth: src/application/server/services/github-AuthService.ts implements AuthService
        - GitHub OAuth via octokit OAuthApp
        - On callback, signs a JWT with user profile; cookie-based session via SESSION_COOKIE_NAME
      - Auth middlewares: cookieAuth (validates JWT and exposes getUser)
    - Data: src/application/server/ApplicationContext.ts
      - Connects to MongoDB via MONGODB_URI, exposes collection mods and ping()
    - Client: src/application/client
      - React 19 + Mantine UI + React Router (HashRouter) + TanStack Query
      - Generated API clients live in src/application/client/_autogen/ via orval; local target reads http://localhost:3000/v3/api-docs

  - Daemon (src/daemon)
    - Entrypoint: src/daemon/ApplicationContext.ts (Bun.serve) -> routes /api, /v3/api-docs
    - API: src/daemon/Application.ts with similar middleware stack; health checks SQLite
    - Config: src/daemon/ApplicationConfig.ts loads TOML
    - Database: src/daemon/database
      - drizzle with bun:sqlite
      - SQL migrations stored in src/daemon/database/ddl (generated via drizzle-kit)
      - At boot, src/daemon/database/ApplicationContext.ts loads compiled SQL from index-ddl.ts and applies unapplied migrations (tracked in __drizzle_migrations)

- Build & deploy
  - bun build compiles each runtime to a single native binary (dist/application, dist/appd)
  - Dockerfile copies dist/application into a minimal Debian image and exposes 3000; docker-compose also runs mongodb

## Notes for agents

- Orval generation for local clients requires the web application running so the OpenAPI route is reachable.
- The web application uses env-based config and will throw at startup if required vars are missing; set them before bun run dev/build.
- Database layers differ: web application uses MongoDB; daemon uses SQLite + drizzle; don’t conflate their migration or connection logic.
