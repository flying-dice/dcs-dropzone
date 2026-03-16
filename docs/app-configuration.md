# App Configuration

This document explains how configuration works across the three Dropzone applications: **Webapp**, **Daemon**, and **Launcher**.

## Overview

Configuration flows through three layers, each one capable of overriding the previous:

1. **Build-time constants** — baked into the compiled binary via `Bun.build({ define })`.
2. **Hardcoded defaults** — passed to `RcConfig` as the `defaults` argument.
3. **Runtime overrides** — environment variables and `.rc` files, resolved by the [`rc`](https://www.npmjs.com/package/rc) module at startup.

This layered approach means that CI builds target the correct production URLs out of the box, local builds default to `localhost`, and any value can still be changed at runtime without recompiling.

> See the following links for more info:
> - https://bun.com/docs/guides/runtime/build-time-constants
> - https://www.npmjs.com/package/rc

## Layer 1 — Build-Time Constants

Each app has a `build.ts` that calls `Bun.build` with a `define` block. The [`getenv`](https://www.npmjs.com/package/getenv) helper reads from the **build** environment with a localhost fallback:

```ts
// apps/webapp/build.ts
define: {
  __WEBAPP_URL: JSON.stringify(string("WEBAPP_URL", "http://localhost:3000/")),
  __DAEMON_URL: JSON.stringify(string("DAEMON_URL", "http://localhost:56499/")),
}
```

At compile time Bun replaces every occurrence of the declared `__WEBAPP_URL` global with the resolved string literal. If the env var is not set the fallback is used, so a plain `bun run webapp:build` on a developer machine produces a binary pointing at localhost.

### Constants per app

| App        | Constant               | Env Var              | Local Fallback                  |
|------------|------------------------|----------------------|---------------------------------|
| **Webapp** | `__WEBAPP_URL`         | `WEBAPP_URL`         | `http://localhost:3000/`        |
| **Webapp** | `__DAEMON_URL`         | `DAEMON_URL`         | `http://localhost:56499/`       |
| **Daemon** | `__WEBAPP_URL`         | `WEBAPP_URL`         | `http://localhost:3000/`        |
| **Daemon** | `__DAEMON_URL`         | `DAEMON_URL`         | `http://localhost:56499/`       |
| **Daemon** | `__WEBVIEW_WORKER_MODULE_PATH` | _(not overridable)_ | `./src/webview/worker.ts` |
| **Launcher** | `__RELEASES_BASE_URL` | `RELEASES_BASE_URL` | `http://localhost:8081/`       |

## Layer 2 — Parsed Constants & RcConfig Defaults

Each app's `AppConfig.ts` declares the `__` globals and parses them through a Zod schema with its own defaults as a safety net:

```ts
declare const __WEBAPP_URL: string;

export const constants = Constants.parse({
  WebappUrl: typeof __WEBAPP_URL !== "undefined" ? __WEBAPP_URL : undefined,
});
```

These parsed constants are then passed as defaults into `RcConfig`:

```ts
export const appConfig = new RcConfig<AppConfig>("DropzoneDaemon", AppConfig, {
  host: "127.0.0.1",
  port: 56499,
  webappUrl: constants.WebappUrl,
  daemonUrl: constants.DaemonUrl,
});
```

`RcConfig` is a thin wrapper around the `rc` module:

```ts
export class RcConfig<CONFIG> {
  public readonly config: CONFIG;

  constructor(appName: string, configSchema: ZodType<CONFIG>, defaults: Partial<CONFIG>) {
    this.config = configSchema.parse(rc(appName, defaults));
  }
}
```

## Layer 3 — Runtime Overrides

Because `rc` is used under the hood, any value can be overridden at runtime without rebuilding, using the standard `rc` lookup order:

1. **Command-line args** — `--webappUrl=https://...`
2. **Environment variables** — `DropzoneDaemon_webappUrl=https://...`
3. **RC files** — `.DropzoneDaemonrc`, `.DropzoneWebapprc`, `.DropzoneLauncherrc` (INI or JSON)

The `.rc` files checked into each app directory provide convenient local-development overrides:

| App        | RC file                  | `appName`            |
|------------|--------------------------|----------------------|
| **Webapp** | `.DropzoneWebapprc`      | `DropzoneWebapp`     |
| **Daemon** | `.DropzoneDaemonrc`      | `DropzoneDaemon`     |
| **Launcher** | `.DropzoneLauncherrc`  | `DropzoneLauncher`   |

## CI / GitHub Actions

In the GitHub Actions workflows the build-time env vars are set on the relevant build steps so the compiled artefacts are bound to their production deployment targets:

```yaml
- name: Build Webapp
  run: bun run webapp:build
  env:
    WEBAPP_URL: https://dcs-dropzone-container.flying-dice.workers.dev/

- name: Build Daemon
  run: bun run daemon:build
  env:
    WEBAPP_URL: https://dcs-dropzone-container.flying-dice.workers.dev/

- name: Build Launcher
  run: bun run launcher:build
  env:
    RELEASES_BASE_URL: https://github.com/flying-dice/dcs-dropzone/releases/latest/download/
```

Local builds intentionally omit these env vars so every constant falls back to localhost, ensuring a developer build never accidentally talks to production services.

## Summary

```
Build env var ──► Bun define ──► Declared __CONSTANT ──► Zod Constants.parse()
                                                              │
                                                              ▼
                                                      RcConfig defaults
                                                              │
                                                    rc() merges with:
                                                     • .rc files
                                                     • env vars
                                                     • CLI args
                                                              │
                                                              ▼
                                                      Final AppConfig
```

Build-time constants set the **expected** defaults for the target environment. Runtime overrides (`rc` files, env vars, CLI args) allow those defaults to be changed without recompiling.
