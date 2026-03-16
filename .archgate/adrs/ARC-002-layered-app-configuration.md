---
id: ARC-002
title: Layered App Configuration
domain: general
rules: false
---

# Layered App Configuration

## Context

The Dropzone project consists of three separately built and deployed applications — **Webapp**, **Daemon**, and **Launcher**. Each application must resolve configuration values that differ between local development, CI builds, and production deployments (e.g., service URLs, ports, feature flags).

Without a consistent configuration strategy, teams risk:
1. **Hardcoded values** scattered across source files that require code changes to switch environments.
2. **Inconsistent override mechanisms** where each app invents its own way to accept runtime config, making operations and debugging harder.
3. **Accidental production traffic** from local builds that point at live services.

## Decision

Configuration flows through three ordered layers, each capable of overriding the previous:

1. **Build-time constants** — baked into the compiled binary via `Bun.build({ define })`.
2. **Hardcoded defaults** — passed to `RcConfig` as the `defaults` argument, parsed through a Zod schema.
3. **Runtime overrides** — environment variables, CLI args, and `.rc` files, resolved by the [`rc`](https://www.npmjs.com/package/rc) module at startup.

### Layer 1 — Build-Time Constants

Each app has a `build.ts` that calls `Bun.build` with a `define` block. The `getenv` helper reads from the **build** environment with a localhost fallback. At compile time Bun replaces every occurrence of the declared `__CONSTANT` global with the resolved string literal. If the env var is not set the fallback is used, so a plain `bun run <app>:build` on a developer machine produces a binary pointing at localhost.

| App          | Constant                        | Env Var              | Local Fallback                  |
|--------------|---------------------------------|----------------------|---------------------------------|
| **Webapp**   | `__WEBAPP_URL`                  | `WEBAPP_URL`         | `http://localhost:3000/`        |
| **Webapp**   | `__DAEMON_URL`                  | `DAEMON_URL`         | `http://localhost:56499/`       |
| **Webapp**   | `__ENABLE_SERVE_DEVELOPMENT`    | _(not overridable)_  | `true`                          |
| **Webapp**   | `__ENABLE_UI_DEBUG`             | _(not overridable)_  | `true`                          |
| **Webapp**   | `__ENABLE_GENERATE_SCHEMA`      | _(not overridable)_  | `true`                          |
| **Daemon**   | `__WEBAPP_URL`                  | `WEBAPP_URL`         | `http://localhost:3000/`        |
| **Daemon**   | `__DAEMON_URL`                  | `DAEMON_URL`         | `http://localhost:56499/`       |
| **Daemon**   | `__WEBVIEW_WORKER_MODULE_PATH`  | _(not overridable)_  | `./src/webview/worker.ts`       |
| **Daemon**   | `__ENABLE_SERVE_DEVELOPMENT`    | _(not overridable)_  | `true`                          |
| **Daemon**   | `__ENABLE_WEBVIEW_WORKER_DEBUG` | _(not overridable)_  | `true`                          |
| **Daemon**   | `__ENABLE_GENERATE_SCHEMA`      | _(not overridable)_  | `true`                          |
| **Launcher** | `__RELEASES_BASE_URL`           | `RELEASES_BASE_URL`  | `http://localhost:8081/`        |

### Layer 2 — Parsed Constants & RcConfig Defaults

Each app's `AppConfig.ts` declares the `__` globals and parses them through a Zod schema with its own defaults as a safety net. These parsed constants are then passed as defaults into `RcConfig`, a thin wrapper around the `rc` module that validates the merged result with Zod.

### Layer 3 — Runtime Overrides

Because `rc` is used under the hood, any value can be overridden at runtime without rebuilding, using the standard `rc` lookup order:

1. **Command-line args** — `--webappUrl=https://...`
2. **Environment variables** — `DropzoneDaemon_webappUrl=https://...`
3. **RC files** — `.DropzoneDaemonrc`, `.DropzoneWebapprc`, `.DropzoneLauncherrc` (INI or JSON)

| App          | RC file                | `appName`          |
|--------------|------------------------|--------------------|
| **Webapp**   | `.DropzoneWebapprc`    | `DropzoneWebapp`   |
| **Daemon**   | `.DropzoneDaemonrc`    | `DropzoneDaemon`   |
| **Launcher** | `.DropzoneLauncherrc`  | `DropzoneLauncher` |

### CI / GitHub Actions

In CI workflows the build-time env vars are set on the relevant build steps so compiled artefacts are bound to their production deployment targets. Local builds intentionally omit these env vars so every constant falls back to localhost.

## Do's and Don'ts

### Do

- **Do** add new configuration values to the appropriate layer — build-time for environment-specific URLs, `RcConfig` defaults for sensible fallbacks, runtime for operator overrides.
- **Do** declare all build-time constants in the app's `build.ts` `define` block with a localhost fallback.
- **Do** parse all configuration through a Zod schema in `AppConfig.ts` to catch invalid or missing values early.
- **Do** use the `rc` app name matching the pattern `Dropzone<AppName>` for consistency across apps.

### Don't

- **Don't** hardcode environment-specific values (URLs, ports, API keys) directly in source files outside of `build.ts` define blocks.
- **Don't** invent custom configuration mechanisms — use the existing `RcConfig` wrapper with `rc` and Zod.
- **Don't** commit `.rc` files with production values into the repository — `.rc` files in the repo should contain local-development overrides only.

## Consequences

### Positive

- **Safe local development:** A plain build on a developer machine never accidentally targets production services.
- **Consistent override mechanism:** All three apps follow the same layered pattern, reducing cognitive overhead for operators and developers.
- **Runtime flexibility:** Operators can change configuration at runtime without recompiling via env vars, CLI args, or `.rc` files.
- **Validation at startup:** Zod schemas catch configuration errors immediately rather than at the point of use.

### Negative

- **Three-layer mental model:** New contributors must understand the precedence order (build-time → defaults → runtime) to debug configuration issues.

### Risks

- **Stale build-time constants:** If CI env vars are changed but artefacts are not rebuilt, the old values persist in the binary.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

## References

- [Bun Build-Time Constants](https://bun.com/docs/guides/runtime/build-time-constants)
- [rc module](https://www.npmjs.com/package/rc)
- [getenv module](https://www.npmjs.com/package/getenv)
