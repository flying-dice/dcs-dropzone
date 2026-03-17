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

We adopt a single-file environment orchestration pattern (`env.ts`) per application, utilizing Bun's build API, `import.meta.main`, and a strict prefix-based resolution hierarchy.

### Namespace Prefix: `DZ_`

Only environment variables prefixed with `DZ_` are automatically processed by this system. Non-prefixed variables in the process environment are ignored, avoiding accidental leakage.

### Single Global Snapshot: `_BUILD_DZ_ENV`

During the build step, `env.ts` captures all active `DZ_` variables (excluding any key containing `SECRET`) and injects them into the compiled binary as a single global JSON object literal named `_BUILD_DZ_ENV` via Bun's `define` feature.

### Resolution Hierarchy

At both dev-time and runtime, variables are resolved in the following priority order (highest to lowest):

1. **CLI arguments** — `--DZ_KEY=value` passed on the command line
2. **Active `Bun.env`** — `DZ_`-prefixed variables present in the live process environment
3. **`_BUILD_DZ_ENV` snapshot** — values baked into the compiled binary at build time

### Layer 2 — Parsed Constants & RcConfig Defaults

Each app's `AppConfig.ts` imports `env` from `env.ts` and passes individual `DZ_` values through a Zod schema with sensible localhost defaults as a safety net. These parsed constants are then passed as defaults into `RcConfig`, a thin wrapper around the `rc` module that validates the merged result with Zod.

### Layer 3 — Runtime Overrides

Because `rc` is used under the hood, any `AppConfig` field can still be overridden at runtime without rebuilding via the standard `rc` lookup order:

1. **Command-line args** — `--webappUrl=https://...`
2. **Environment variables** — `DropzoneDaemon_webappUrl=https://...`
3. **RC files** — `.DropzoneDaemonrc`, `.DropzoneWebapprc`, `.DropzoneLauncherrc` (INI or JSON)

| App          | RC file                | `appName`          |
|--------------|------------------------|--------------------|
| **Webapp**   | `.DropzoneWebapprc`    | `DropzoneWebapp`   |
| **Daemon**   | `.DropzoneDaemonrc`    | `DropzoneDaemon`   |
| **Launcher** | `.DropzoneLauncherrc`  | `DropzoneLauncher` |

### `env.ts` — Dual-Role Module

Each app has an `env.ts` at its root that serves two purposes depending on how it is invoked:

- **As a module** (`import { env } from "../env.ts"`): exports the resolved `env` object for use in `AppConfig.ts`.
- **As a build script** (`bun env.ts`): executes the full build via `import.meta.main`, injecting the `_BUILD_DZ_ENV` snapshot.

```ts
import { parseArgs } from "util";

declare global {
  var _BUILD_DZ_ENV: Record<string, string> | undefined;
}

const { values } = parseArgs({ args: Bun.argv, strict: false });
const buildSnapshot = typeof _BUILD_DZ_ENV !== "undefined" ? _BUILD_DZ_ENV : {};

const liveBunEnv = Object.fromEntries(
  Object.entries(Bun.env).filter(([key]) => key.startsWith("DZ_"))
);
const liveCliArgs = Object.fromEntries(
  Object.entries(values)
    .filter(([key]) => key.startsWith("DZ_"))
    .map(([key, value]) => [key, String(value)])
);

export const env = {
  ...buildSnapshot,
  ...liveBunEnv,
  ...liveCliArgs,
};

if (import.meta.main) {
  const snapshotToBake = { ...liveBunEnv, ...liveCliArgs };

  // Strip out any keys containing "SECRET" to prevent leaking into the build artifact
  for (const key in snapshotToBake) {
    if (key.includes("SECRET")) delete snapshotToBake[key];
  }

  await Bun.build({
    entrypoints: ["./src/index.ts"],
    // ...app-specific compile options...
    define: {
      _BUILD_DZ_ENV: JSON.stringify(snapshotToBake),
    },
  });
}
```

### `DZ_` Variable Registry

| App          | Variable                        | Zod Default                     |
|--------------|---------------------------------|---------------------------------|
| **Daemon**   | `DZ_WEBAPP_URL`                 | `http://localhost:3000/`        |
| **Daemon**   | `DZ_DAEMON_URL`                 | `http://localhost:56499/`       |
| **Daemon**   | `DZ_WEBVIEW_WORKER_MODULE_PATH` | `./src/webview/worker.ts`       |
| **Daemon**   | `DZ_ENABLE_SERVE_DEVELOPMENT`   | `true`                          |
| **Daemon**   | `DZ_ENABLE_WEBVIEW_WORKER_DEBUG`| `true`                          |
| **Daemon**   | `DZ_ENABLE_GENERATE_SCHEMA`     | `true`                          |
| **Webapp**   | `DZ_WEBAPP_URL`                 | `http://localhost:3000/`        |
| **Webapp**   | `DZ_DAEMON_URL`                 | `http://localhost:56499/`       |
| **Webapp**   | `DZ_ENABLE_SERVE_DEVELOPMENT`   | `true`                          |
| **Webapp**   | `DZ_ENABLE_UI_DEBUG`            | `true`                          |
| **Webapp**   | `DZ_ENABLE_GENERATE_SCHEMA`     | `true`                          |
| **Launcher** | `DZ_RELEASES_BASE_URL`          | `http://localhost:8081/`        |

### CI / GitHub Actions

In CI workflows the `DZ_`-prefixed variables are set on the relevant build steps so that `bun env.ts` bakes them into the compiled artifact. Local builds intentionally omit these variables so every constant falls back to its Zod default (localhost).

## Do's and Don'ts

### Do

- **Do** prefix all new public configuration variables with `DZ_` — the build system picks them up automatically with no script changes required.
- **Do** run `bun env.ts` (not `bun src/index.ts`) to produce a production build with the environment snapshot baked in.
- **Do** pass `DZ_`-prefixed secrets via CI environment variables — they are stripped from the snapshot automatically (any key containing `SECRET` is excluded).
- **Do** parse the `env` object through a Zod schema in `AppConfig.ts` to re-establish strict types and validate required fields before the application boots.
- **Do** use the `rc` app name matching the pattern `Dropzone<AppName>` for runtime RC file overrides.

### Don't

- **Don't** use unprefixed environment variable names for values managed by this system — they will be ignored by `env.ts`.
- **Don't** add individual `declare const __CONSTANT` globals or reference them in `AppConfig.ts` — use `env.DZ_*` instead.
- **Don't** invent custom configuration mechanisms — use `env.ts` + `RcConfig` with Zod.
- **Don't** commit `.rc` files with production values into the repository — `.rc` files in the repo should contain local-development overrides only.

## Consequences

### Positive

- **Zero-maintenance scaling:** New public configuration variables simply need the `DZ_` prefix. No build scripts or interfaces need to be manually updated.
- **Security by default:** The pattern inherently ignores non-prefixed variables and explicitly strips keys containing `SECRET` from the build artifact.
- **Safe local development:** Running `bun run src/index.ts` directly never accidentally targets production services — all Zod defaults point at localhost.
- **Consistent override mechanism:** All three apps follow the same layered pattern, reducing cognitive overhead for operators and developers.
- **Clean compiled output:** A single `_BUILD_DZ_ENV` object avoids global namespace pollution and lets Bun's dead-code elimination remove unused branches.
- **Runtime flexibility:** Operators can still change configuration at runtime without recompiling via `DZ_`-prefixed env vars, CLI args, or `.rc` files.

### Negative

- **Type erasure:** The `env` export is typed loosely as `Record<string, string>`. All callers must pass values through a Zod schema in `AppConfig.ts` to recover strict types.
- **Three-layer mental model:** New contributors must understand the precedence order (CLI > Bun.env > snapshot > Zod defaults > rc overrides) to debug configuration issues.

### Risks

- **Stale build-time snapshot:** If CI env vars are changed but artifacts are not rebuilt, the old values persist in the binary.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

## References

- [Bun Build-Time Constants](https://bun.com/docs/guides/runtime/build-time-constants)
- [Bun `define` option](https://bun.sh/docs/bundler/api#define)
- [rc module](https://www.npmjs.com/package/rc)
