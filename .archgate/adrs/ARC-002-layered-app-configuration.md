---
id: ARC-002
title: Unified Build-Time and Runtime Environment Variable Resolution
domain: general
rules: false
---

# Unified Build-Time and Runtime Environment Variable Resolution

## Context

The Dropzone project consists of three separately built and deployed applications — **Webapp**, **Daemon**, and **Launcher**. Each application must resolve configuration values that differ between local development, CI builds, and production deployments (e.g., service URLs, ports, feature flags).

Without a consistent configuration strategy, teams risk:
1. **Hardcoded values** scattered across source files that require code changes to switch environments.
2. **Inconsistent override mechanisms** where each app invents its own way to accept runtime config, making operations and debugging harder.
3. **Accidental production traffic** from local builds that point at live services.
4. **Maintenance overhead** from having to manually update build scripts every time a new environment variable is added.
5. **Secret leakage** from statically compiling sensitive values into build artifacts.

## Decision

Configuration flows through three ordered layers:

1. **`.env` files** — per-app `.env.local` and `.env.prod` files loaded by Bun's `--env-file` flag, providing development and production defaults respectively.
2. **Build-time snapshot** — a single `_BUILD_DZ_ENV` object baked into the compiled binary via `Bun.build({ define })`.
3. **Per-app Zod validation** — each app defines an `EnvConfig` schema in `env.ts` and an `AppConfig` schema in `AppConfig.ts` to validate and map env vars to typed config objects.

Runtime overrides are achieved by setting `DZ_`-prefixed environment variables before starting the process, or by passing `--DZ_KEY=value` CLI arguments.

### Namespace Prefix: `DZ_`

Only environment variables prefixed with `DZ_` are processed by this system. Non-prefixed variables are ignored, preventing accidental leakage and providing a clear convention for new configuration values.

### `.env` Files

Each app maintains two checked-in `.env` files:

- **`.env.local`** — development-friendly defaults (localhost URLs, debug flags enabled).
- **`.env.prod`** — production values or placeholders (remote URLs, debug flags disabled).

These files are loaded by Bun's `--env-file` flag in the app's `package.json` scripts:

```json
{
  "dev": "bun --env-file=.env.local --watch src/index.ts",
  "build": "bun --env-file=.env.prod _build.ts",
  "tests": "bun --env-file=.env.local test --coverage"
}
```

The root `package.json` test script loads all app `.env.local` files at once:

```json
{
  "test": "bun --env-file=apps/daemon/.env.local --env-file=apps/launcher/.env.local --env-file=apps/webapp/.env.local test"
}
```

> Secrets such as `DZ_WEBAPP_USER_COOKIE_SECRET` are defined in `.env.local` for development but commented out or omitted in `.env.prod`. Production secrets must be provided at runtime via the deployment environment.

### Single Global Snapshot: `_BUILD_DZ_ENV`

During the build step each app's `_build.ts` imports the validated env from its local `env.ts`, serialises it with `JSON.stringify(env)`, and injects it into the compiled binary as a single global JSON object named `_BUILD_DZ_ENV` via Bun's `define` feature. Variables that are absent (e.g. secrets marked `.optional()` in the Zod schema) are simply not included in the snapshot.

### `@packages/dz-config`

The `@packages/dz-config` workspace package is the central home for environment resolution. It exports a single value:

- **`env`** — the resolved `Record<string, string>` following the hierarchy CLI args > `Bun.env` > `_BUILD_DZ_ENV` snapshot. Only `DZ_`-prefixed variables are included.

```ts
// packages/dz-config/src/env.ts (simplified)
export const env: Record<string, string> = {
  ...buildSnapshot,   // _BUILD_DZ_ENV injected at compile time
  ...liveBunEnv,      // DZ_* from Bun.env
  ...liveCliArgs,     // --DZ_* from CLI
};
```

### Resolution Hierarchy

Variables are resolved in the following priority order (highest to lowest):

1. **CLI arguments** — `--DZ_KEY=value` passed on the command line.
2. **Active `Bun.env`** — `DZ_`-prefixed variables present in the live process environment (includes values loaded from `.env` files via `--env-file`).
3. **`_BUILD_DZ_ENV` snapshot** — values baked into the compiled binary at build time.

### Per-App `EnvConfig` and `AppConfig` Pattern

Each app uses a two-file pattern to validate and map environment variables:

#### `env.ts` — Environment Validation

Each app's root `env.ts` imports the raw `env` from `@packages/dz-config`, defines a Zod `EnvConfig` schema listing every `DZ_` variable the app requires, and exports the parsed result as a default export. This is where Zod `.default()` values are declared for variables that have sensible fallbacks.

```ts
// apps/daemon/env.ts
import { env } from "@packages/dz-config";
import { z } from "zod";

export const EnvConfig = z.object({
  DZ_DAEMON_HOST: z.ipv4(),
  DZ_DAEMON_PORT: z.coerce.number().int().min(1).max(65535),
  // ... all DZ_ variables this app needs
  DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH: z.string().default("./src/webview/worker.ts"),
});

export default EnvConfig.parse(env);
```

#### `AppConfig.ts` — Domain Configuration

Each app's `src/AppConfig.ts` imports the validated env from `../env.ts` and maps the `DZ_`-prefixed keys to domain-friendly field names via an `AppConfig` Zod schema.

```ts
// apps/daemon/src/AppConfig.ts
import env from "../env.ts";

export const AppConfig = z.object({
  host: z.ipv4(),
  port: z.number().int().min(1).max(65535),
  webappUrl: z.url(),
  // ...
});

export const appConfig = AppConfig.parse({
  host: env.DZ_DAEMON_HOST,
  port: env.DZ_DAEMON_PORT,
  webappUrl: env.DZ_WEBAPP_URL,
  // ...
});
```

#### `_build.ts` — Build-Time Snapshot

Each app's `_build.ts` imports the validated env from its local `env.ts` and bakes it into the compiled binary:

```ts
// apps/daemon/_build.ts
import env from "./env.ts";

await Bun.build({
  // ...
  define: {
    _BUILD_DZ_ENV: JSON.stringify(env),
  },
});
```

### `DZ_` Variable Registry

| App          | Variable                                 | `.env.local` Default                  | Notes                                 |
|--------------|------------------------------------------|---------------------------------------|---------------------------------------|
| **Daemon**   | `DZ_DAEMON_HOST`                         | `127.0.0.1`                           |                                       |
| **Daemon**   | `DZ_DAEMON_PORT`                         | `56499`                               |                                       |
| **Daemon**   | `DZ_DAEMON_WEBVIEW_WINDOW_TITLE`         | `Dropzone`                            |                                       |
| **Daemon**   | `DZ_DAEMON_ENABLE_WEBVIEW_WORKER_DEBUG`  | `true`                                |                                       |
| **Daemon**   | `DZ_DAEMON_DATABASE_PATH`                | `data.sqlite`                         |                                       |
| **Daemon**   | `DZ_DAEMON_WEBVIEW_WORKER_MODULE_PATH`   | `./src/webview/worker.ts`             | Zod default in `EnvConfig`            |
| **Daemon**   | `DZ_DAEMON_WGET_PATH`                    | _(optional)_                          | Auto-detected from PATH if absent     |
| **Daemon**   | `DZ_DAEMON_SEVENZIP_PATH`                | _(optional)_                          | Auto-detected from PATH if absent     |
| **Shared**   | `DZ_WEBAPP_URL`                          | `http://localhost:3000/`              | Used by Daemon and Webapp             |
| **Shared**   | `DZ_DAEMON_URL`                          | `http://localhost:56499/`             | Used by Daemon and Webapp             |
| **Shared**   | `DZ_ENABLE_SERVE_DEVELOPMENT`            | `true`                                | Used by Daemon and Webapp             |
| **Shared**   | `DZ_ENABLE_GENERATE_SCHEMA`              | `true`                                | Used by Daemon and Webapp             |
| **Webapp**   | `DZ_WEBAPP_PORT`                         | `3000`                                |                                       |
| **Webapp**   | `DZ_WEBAPP_MONGO_URI`                    | `mongodb://localhost:27017/dcs-dropzone` | Optional in schema; required at runtime |
| **Webapp**   | `DZ_WEBAPP_USER_COOKIE_SECRET`           | `local-cookie-secret`                 | Optional in schema; must be set for production via deployment env |
| **Webapp**   | `DZ_WEBAPP_USER_COOKIE_NAME`             | `USERID`                              |                                       |
| **Webapp**   | `DZ_WEBAPP_USER_COOKIE_MAX_AGE`          | `86400`                               |                                       |
| **Webapp**   | `DZ_WEBAPP_AUTH_REDIRECT_URL`            | `http://localhost:3000/`              | Optional in schema                    |
| **Webapp**   | `DZ_WEBAPP_AUTH_SERVICE_GH`              | _(optional)_                          | JSON string; activates GitHub OAuth   |
| **Launcher** | `DZ_LAUNCHER_RELEASE_TAR_PATH`           | `http://localhost:8081/dcs-dropzone.tar`          |                           |
| **Launcher** | `DZ_LAUNCHER_RELEASE_TAR_MANIFEST_PATH`  | `http://localhost:8081/dcs-dropzone.tar.manifest` |                           |
| **Launcher** | `DZ_LAUNCHER_MANIFEST`                   | `.manifest`                           |                                       |

### CI / GitHub Actions

In CI workflows the root test script loads all `.env.local` files via `--env-file` flags. For production builds, each app's `build` script loads `.env.prod` via `--env-file`, and the resulting env is baked into the compiled artifact via `_BUILD_DZ_ENV`. Production secrets must be injected at build time via the CI environment.

## Do's and Don'ts

### Do

- **Do** prefix all new configuration variables with `DZ_` so they are picked up by `@packages/dz-config`.
- **Do** add new variables to the app's `.env.local` (with development values) and `.env.prod` (with production values or placeholders).
- **Do** add new variables to the app's `EnvConfig` Zod schema in `env.ts` with appropriate validation.
- **Do** map validated env vars to domain-friendly names in `AppConfig.ts` via `AppConfig.parse()`.
- **Do** import the validated env from the app's local `env.ts` in `_build.ts` and pass it to `define: { _BUILD_DZ_ENV: JSON.stringify(env) }`.
- **Do** mark secrets as `.optional()` in the `EnvConfig` schema so builds succeed without them; provide them at runtime for production.

### Don't

- **Don't** use unprefixed environment variable names for values managed by this system — they will be ignored by `env`.
- **Don't** import `env` directly from `@packages/dz-config` in `AppConfig.ts` — import the validated result from the app's `env.ts` instead.
- **Don't** hardcode environment-specific values (URLs, ports, API keys) directly in source files; use `env.DZ_*` via the env/config pattern.
- **Don't** commit production secrets in `.env.prod` files — leave them commented out or omitted and supply them via the deployment environment.

## Consequences

### Positive

- **Explicit configuration:** `.env` files make all available variables and their defaults visible at a glance.
- **Safe local development:** `.env.local` files ship with localhost defaults so `bun run dev` works out of the box.
- **Type-safe validation:** The `EnvConfig` → `AppConfig` two-step pattern ensures all configuration is Zod-validated before use.
- **Clean compiled output:** A single `_BUILD_DZ_ENV` object avoids global namespace pollution and lets Bun's dead-code elimination remove unused branches.
- **Centralised resolution:** `@packages/dz-config` is the single source of truth for merging build-time, runtime, and CLI environment variables.

### Negative

- **Type erasure at the boundary:** The `env` export from `@packages/dz-config` is typed loosely as `Record<string, string>`. Type safety is recovered by the per-app `EnvConfig` Zod schema.

### Risks

- **Stale build-time snapshot:** If CI env vars are changed but artifacts are not rebuilt, the old values persist in the binary.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

## References

- [Bun Build-Time Constants](https://bun.com/docs/guides/runtime/build-time-constants)
- [Bun `define` option](https://bun.sh/docs/bundler/api#define)
- [Bun `--env-file` flag](https://bun.sh/docs/runtime/env)
