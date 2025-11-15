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
  - Generate SQL from I18nKeys.ts into src/daemon/database/ddl/ then bundle to index-ddl.ts used at runtime:

```bash path=null start=null
bun run drizzle       # runs: drizzle-kit generate --config drizzle.config.ts --name=init
bun run postdrizzle   # builds src/daemon/database/index-ddl.ts
```

- Tests: none configured in package.json (no test runner present).

## Environment & config

- Web application (src/app)
  - Required env vars (see src/app/server/ApplicationConfig.ts and src/app/server/Application.ts):
    - PORT, LOG_LEVEL, USER_COOKIE_SECRET, USER_COOKIE_NAME (optional, default __Secure-USERID), GH_CLIENT_ID, GH_CLIENT_SECRET, GH_AUTHORIZATION_CALLBACK_URL, GH_HOMEPAGE_URL, MONGODB_URI
  - Example (replace placeholders):

```bash path=null start=null
export PORT=3000
export LOG_LEVEL=info
export USER_COOKIE_SECRET={{USER_COOKIE_SECRET}}
export USER_COOKIE_NAME=__Secure-USERID
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
  - Web application (src/app)
    - Entrypoint: src/app/Application.ts (Bun.serve)
      - Serves client HTML for "/*"
      - Proxies API routes to Hono application: /auth, /api, /v3/api-docs
    - API: src/app/server/Application.ts (Hono)
      - Middleware: CORS, requestId, structured request logging (pino via loggerMiddleware)
      - Routes:
        - /auth: OAuth login/redirect/user/logout (see services below)
        - /api/health: Mongo connectivity check
        - /api/user-mods: CRUD for user mods
        - /v3/api-docs + /api: OpenAPI JSON + Scalar UI
    - Services and data model
- Services (e.g., ModService, UserService, UserModService) encapsulate domain logic and persistence.
- Services interact with Mongoose entities in src/app/server/entities (Mod, ModSummary, User) and never return raw Mongoose docs.
- All inputs to and outputs from services are validated with Zod. Non-trivial responses are returned in the shape of the Zod Data schemas under src/app/server/schemas so routes can return them directly.
- Auth flow: on `/:provider/callback` the server persists/updates the user and sets a signed cookie (`USER_COOKIE_NAME`) holding the user id. The `cookieAuth` middleware reads it via `getSignedCookie`, loads the user, and exposes it via `c.var.getUser()`. Logout deletes the cookie.
- Mongo connection is managed in src/app/server/Database.ts using MONGODB_URI.
    - Client: src/app/client
      - React 19 + Mantine UI + React Router (HashRouter) + TanStack Query
      - Generated API clients live in src/app/client/_autogen/ via orval; local target reads http://localhost:3000/v3/api-docs

  - Daemon (src/daemon)
    - Entrypoint: src/daemon/Application.ts (Bun.serve) -> routes /api, /v3/api-docs
    - API: src/daemon/Application.ts with similar middleware stack; health checks SQLite
    - Config: src/daemon/ApplicationConfig.ts loads TOML
    - Database: src/daemon/database
      - drizzle with bun:sqlite
      - SQL migrations stored in src/daemon/database/ddl (generated via drizzle-kit)
      - At boot, src/daemon/database/Application.ts loads compiled SQL from index-ddl.ts and applies unapplied migrations (tracked in __drizzle_migrations)

- Build & deploy
  - bun build compiles each runtime to a single native binary (dist/application, dist/appd)
  - Dockerfile copies dist/application into a minimal Debian image and exposes 3000; docker-compose also runs mongodb

## Notes for agents

- LLMs and agents: Always consult and respect https://mantine.dev/llms.txt when generating or modifying UI using Mantine components/styles.
- Orval generation for local clients requires the web application running so the OpenAPI route is reachable.
- The web application uses env-based config and will throw at startup if required vars are missing; set them before bun run dev/build.
- Database layers differ: web application uses MongoDB; daemon uses SQLite + drizzle; don’t conflate their migration or connection logic.
