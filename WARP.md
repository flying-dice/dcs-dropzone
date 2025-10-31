# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Install deps

```bash path=null start=null
bun install
```

- Dev servers
  - Web app (serves React SPA + Hono API on PORT):

```bash path=null start=null
bun run dev
```

  - Daemon API (reads config.toml for host/port):

```bash path=null start=null
bun run dev:daemon
```

- Build (produces native binaries in dist/)

```bash path=null start=null
bun run build        # web app -> dist/app
bun run build:daemon # daemon  -> dist/appd
```

- Run via Docker Compose (app + MongoDB)

```bash path=null start=null
bun run start
```

- Lint/format with Biome

```bash path=null start=null
bun run biome
```

- API client generation (orval)
  - Local API (requires web app running to serve /v3/api-docs):

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

- Web app (src/app)
  - Required env vars (see src/app/server/app-config.ts and src/app/server/index.ts):
    - PORT, LOG_LEVEL, JWT_SECRET, SESSION_COOKIE_NAME (optional, default JSESSIONID), GH_CLIENT_ID, GH_CLIENT_SECRET, GH_AUTHORIZATION_CALLBACK_URL, SUDO_USERS (comma-separated IDs), GH_HOMEPAGE_URL, MONGODB_URI
  - Example (replace placeholders):

```bash path=null start=null
export PORT=3000
export LOG_LEVEL=info
export JWT_SECRET={{JWT_SECRET}}
export SESSION_COOKIE_NAME=JSESSIONID
export GH_CLIENT_ID={{GH_CLIENT_ID}}
export GH_CLIENT_SECRET={{GH_CLIENT_SECRET}}
export GH_AUTHORIZATION_CALLBACK_URL=http://localhost:3000/auth/github/callback
export SUDO_USERS=12345,67890
export GH_HOMEPAGE_URL=http://localhost:3000/
export MONGODB_URI="mongodb://localhost:27017"
```

- Daemon (src/daemon)
  - Reads TOML config at runtime: `${cwd}/config.toml` (see src/daemon/app-config.ts)
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
  - Web app (src/app)
    - Entrypoint: src/app/index.ts (Bun.serve)
      - Serves client HTML for "/*"
      - Proxies API routes to Hono app: /auth, /api, /v3/api-docs
    - API: src/app/server/app.ts (Hono)
      - Middleware: CORS, requestId, structured request logging (pino via loggerMiddleware)
      - Routes:
        - /auth: OAuth login/redirect/user/logout (see services below)
        - /api/health: Mongo connectivity check
        - /v3/api-docs + /api: OpenAPI JSON + Scalar UI
    - Services
      - Auth: src/app/server/services/github-auth.service.ts implements AuthService
        - GitHub OAuth via octokit OAuthApp
        - On callback, signs a JWT with user profile; cookie-based session via SESSION_COOKIE_NAME
      - Auth middlewares: cookieAuth (validates JWT and exposes getUser), sudoUser (enforces SUDO_USERS)
    - Data: src/app/server/index.ts
      - Connects to MongoDB via MONGODB_URI, exposes collection mods and ping()
    - Client: src/app/client
      - React 19 + Mantine UI + React Router (HashRouter) + TanStack Query
      - Generated API clients live in src/app/client/_autogen/ via orval; local target reads http://localhost:3000/v3/api-docs

  - Daemon (src/daemon)
    - Entrypoint: src/daemon/index.ts (Bun.serve) -> routes /api, /v3/api-docs
    - API: src/daemon/app.ts with similar middleware stack; health checks SQLite
    - Config: src/daemon/app-config.ts loads TOML
    - Database: src/daemon/database
      - drizzle with bun:sqlite
      - SQL migrations stored in src/daemon/database/ddl (generated via drizzle-kit)
      - At boot, src/daemon/database/index.ts loads compiled SQL from index-ddl.ts and applies unapplied migrations (tracked in __drizzle_migrations)

- Build & deploy
  - bun build compiles each runtime to a single native binary (dist/app, dist/appd)
  - Dockerfile copies dist/app into a minimal Debian image and exposes 3000; docker-compose also runs mongodb

## Notes for agents

- Orval generation for local clients requires the web app running so the OpenAPI route is reachable.
- The web app uses env-based config and will throw at startup if required vars are missing; set them before bun run dev/build.
- Database layers differ: web app uses MongoDB; daemon uses SQLite + drizzle; don’t conflate their migration or connection logic.
