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

Configuration flows through two ordered layers:

1. **Build-time snapshot** — a single `_BUILD_DZ_ENV` object baked into the compiled binary via `Bun.build({ define })`.
2. **Zod schema defaults** — per-app fallbacks applied when a variable is absent from both the snapshot and the live environment.

Runtime overrides are achieved simply by setting `DZ_`-prefixed environment variables before starting the process; no separate file-based override mechanism is needed.

### Namespace Prefix: `DZ_`

Only environment variables prefixed with `DZ_` are processed by this system. Non-prefixed variables are ignored, preventing accidental leakage and providing a clear convention for new configuration values.

### Single Global Snapshot: `_BUILD_DZ_ENV`

During the build step, `build.ts` calls `createBuildSnapshot()` from `@packages/dz-config` to capture all active `DZ_` variables (stripping any key containing `SECRET`) and injects them into the compiled binary as a single global JSON object literal named `_BUILD_DZ_ENV` via Bun's `define` feature.

### `@packages/dz-config`

The `@packages/dz-config` workspace package is the central home for all environment resolution utilities. It exports:

- **`env`** — the resolved `Record<string, string>` following the hierarchy CLI args > `Bun.env` > `_BUILD_DZ_ENV` snapshot. Imported directly by `AppConfig.ts` in each app.
- **`createBuildSnapshot()`** — returns the `DZ_`-prefixed variables present at build time (with `SECRET` keys stripped). Imported by `build.ts` in each app.

```ts
// packages/dz-config/src/env.ts (simplified)
export const env: Record<string, string> = {
  ...buildSnapshot,   // _BUILD_DZ_ENV injected at compile time
  ...liveBunEnv,      // DZ_* from Bun.env
  ...liveCliArgs,     // --DZ_* from CLI
};

export function createBuildSnapshot(): Record<string, string> {
  const snapshot = { ...liveBunEnv, ...liveCliArgs };
  for (const key in snapshot) {
    if (key.includes("SECRET")) delete snapshot[key];
  }
  return snapshot;
}
```

### Resolution Hierarchy

Variables are resolved in the following priority order (highest to lowest):

1. **CLI arguments** — `--DZ_KEY=value` passed on the command line
2. **Active `Bun.env`** — `DZ_`-prefixed variables present in the live process environment
3. **`_BUILD_DZ_ENV` snapshot** — values baked into the compiled binary at build time
4. **Zod schema defaults** — per-app fallbacks in `AppConfig.ts` (always localhost / safe values)

### `AppConfig.ts` Pattern

Each app's `AppConfig.ts` imports `env` from `@packages/dz-config` and passes `DZ_` values directly into `AppConfig.parse()`. Zod schemas declare `.default()` values for all optional fields, so the parsed result is always fully typed with no nulls.

```ts
import { env } from "@packages/dz-config";

export const AppConfig = z.object({
  port: z.coerce.number().int().default(56499),
  webappUrl: z.url().default("http://localhost:3000/"),
  // ...
});

export const appConfig = AppConfig.parse({
  port: env.DZ_PORT,
  webappUrl: env.DZ_WEBAPP_URL,
  // ...
});
```

### `DZ_` Variable Registry

| App          | Variable                          | Zod Default                           |
|--------------|-----------------------------------|---------------------------------------|
| **Daemon**   | `DZ_HOST`                         | `127.0.0.1`                           |
| **Daemon**   | `DZ_PORT`                         | `56499`                               |
| **Daemon**   | `DZ_WEBAPP_URL`                   | `http://localhost:3000/`              |
| **Daemon**   | `DZ_DAEMON_URL`                   | `http://localhost:56499/`             |
| **Daemon**   | `DZ_WEBVIEW_WORKER_MODULE_PATH`   | `./src/webview/worker.ts`             |
| **Daemon**   | `DZ_ENABLE_SERVE_DEVELOPMENT`     | `true`                                |
| **Daemon**   | `DZ_ENABLE_WEBVIEW_WORKER_DEBUG`  | `true`                                |
| **Daemon**   | `DZ_ENABLE_GENERATE_SCHEMA`       | `true`                                |
| **Daemon**   | `DZ_WGET_PATH`                    | auto-detected from PATH               |
| **Daemon**   | `DZ_SEVENZIP_PATH`                | auto-detected from PATH               |
| **Daemon**   | `DZ_DATABASE_PATH`                | `<cwd>/data.sqlite`                   |
| **Webapp**   | `DZ_PORT`                         | `3000`                                |
| **Webapp**   | `DZ_MONGO_URI`                    | _(required)_                          |
| **Webapp**   | `DZ_USER_COOKIE_SECRET`           | _(required, excluded from snapshot)_  |
| **Webapp**   | `DZ_USER_COOKIE_NAME`             | `USERID`                              |
| **Webapp**   | `DZ_USER_COOKIE_MAX_AGE`          | `86400`                               |
| **Webapp**   | `DZ_AUTH_REDIRECT_URL`            | falls back to `DZ_WEBAPP_URL`         |
| **Webapp**   | `DZ_AUTH_GH_CLIENT_ID`            | _(optional, activates GitHub OAuth)_  |
| **Webapp**   | `DZ_AUTH_GH_CLIENT_SECRET`        | _(optional, excluded from snapshot)_  |
| **Webapp**   | `DZ_AUTH_GH_REDIRECT_URL`         | _(optional)_                          |
| **Webapp**   | `DZ_WEBAPP_URL`                   | `http://localhost:3000/`              |
| **Webapp**   | `DZ_DAEMON_URL`                   | `http://localhost:56499/`             |
| **Webapp**   | `DZ_ENABLE_SERVE_DEVELOPMENT`     | `true`                                |
| **Webapp**   | `DZ_ENABLE_UI_DEBUG`              | `true`                                |
| **Webapp**   | `DZ_ENABLE_GENERATE_SCHEMA`       | `true`                                |
| **Launcher** | `DZ_RELEASES_BASE_URL`            | `http://localhost:8081/`              |
| **Launcher** | `DZ_DROPZONE_TAR_FILE`            | derived from `DZ_RELEASES_BASE_URL`   |
| **Launcher** | `DZ_DROPZONE_TAR_FILE_MANIFEST`   | derived from `DZ_RELEASES_BASE_URL`   |
| **Launcher** | `DZ_MANIFEST_PATH`                | `.manifest`                           |

> Variables marked _(excluded from snapshot)_ contain `SECRET` in their name and are filtered out by `createBuildSnapshot()`. They must be provided at runtime via `Bun.env`.

### CI / GitHub Actions

In CI workflows the `DZ_`-prefixed variables are set on the relevant build steps so that `bun build.ts` bakes them into the compiled artifact via `createBuildSnapshot()`. Local builds intentionally omit these variables so every constant falls back to its Zod default (localhost).

## Do's and Don'ts

### Do

- **Do** prefix all new configuration variables with `DZ_` — `createBuildSnapshot()` and `env` pick them up automatically with no build script changes required.
- **Do** import `env` from `@packages/dz-config` in `AppConfig.ts` and pass `DZ_` values directly into `AppConfig.parse()`.
- **Do** import `createBuildSnapshot` from `@packages/dz-config` in `build.ts` and pass the result to `define: { _BUILD_DZ_ENV: JSON.stringify(snapshotToBake) }`.
- **Do** suffix secret variable names with `SECRET` (e.g. `DZ_USER_COOKIE_SECRET`, `DZ_AUTH_GH_CLIENT_SECRET`) so they are automatically excluded from the build snapshot.
- **Do** declare Zod `.default()` values on all optional `AppConfig` fields so the schema is self-documenting and parse always succeeds for local dev.

### Don't

- **Don't** use unprefixed environment variable names for values managed by this system — they will be ignored by `env`.
- **Don't** use `AppName_fieldName=value` style env vars — there is no longer an RC module to interpret them.
- **Don't** hardcode environment-specific values (URLs, ports, API keys) directly in source files; use `env.DZ_*` with a Zod default.
- **Don't** commit `.env` files or RC files with production values into the repository.

## Consequences

### Positive

- **Zero-maintenance scaling:** New configuration variables simply need the `DZ_` prefix. No build scripts or interfaces need to be manually updated.
- **Security by default:** Non-prefixed variables are ignored; keys containing `SECRET` are stripped from the build artifact.
- **Safe local development:** Running `bun run src/index.ts` directly never accidentally targets production services — all Zod defaults point at localhost.
- **Simpler mental model:** Two layers (snapshot + Zod defaults) replace the previous three-layer (build constants → RC defaults → RC runtime) model.
- **Clean compiled output:** A single `_BUILD_DZ_ENV` object avoids global namespace pollution and lets Bun's dead-code elimination remove unused branches.
- **Centralised utilities:** `@packages/dz-config` is the single source of truth for environment resolution.

### Negative

- **Type erasure:** The `env` export is typed loosely as `Record<string, string>`. All callers must pass values through a Zod schema in `AppConfig.ts` to recover strict types.

### Risks

- **Stale build-time snapshot:** If CI env vars are changed but artifacts are not rebuilt, the old values persist in the binary.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

## References

- [Bun Build-Time Constants](https://bun.com/docs/guides/runtime/build-time-constants)
- [Bun `define` option](https://bun.sh/docs/bundler/api#define)
