---
id: ARC-003
title: Per-App Build Script Convention with Typed Environment Objects
domain: general
rules: false
supersedes: ARC-002 (env file and package.json scripts sections)
---

# Per-App Build Script Convention with Typed Environment Objects

## Context

ARC-002 established a configuration pattern where each app maintained `.env.local` and `.env.prod` files loaded at runtime via Bun's `--env-file` flag, and exposed multiple `package.json` scripts (`build`, `build:local`, `dev`, `tests`, `tsc`, `biome`, `depcheck`) that each repeated the `--env-file` flag and individual tool invocations.

This approach had several drawbacks:

1. **String-typed env files** — `.env` files are untyped flat text. Adding or renaming a variable required updating the schema, the `.env.local` file, and the `.env.prod` file independently, with no compile-time check that all three stayed in sync.
2. **Scattered quality checks** — `tsc`, `biome`, and `depcheck` were separate `package.json` scripts, meaning a developer could run `bun run build` without having run `bun run tsc` first, silently shipping type errors.
3. **Proliferating `package.json` scripts** — each app accumulated 8–9 scripts, many of which were thin wrappers around a single tool. The distinction between "public" entry points and internal implementation steps was invisible.
4. **Flag repetition** — every script that needed local config repeated `--env-file=.env.local`. Changing the env file path required touching every script.

## Decision

Each app organises its operational scripts under a `scripts/` folder following a naming convention that distinguishes public entry points from private implementation scripts. Environment values are defined as typed TypeScript objects rather than `.env` files.

### `scripts/` Folder Convention

Scripts in the `scripts/` folder fall into two categories, distinguished by a leading underscore:

- **Public scripts** (`build.ts`, `dev.ts`, `test.ts`, `start.ts`) — the scripts referenced in `package.json`. They are responsible for selecting the target environment, running quality gates, and delegating to private scripts.
- **Private scripts** (`_build.ts`, `_env.ts`, `_drizzle-migration.setup.ts`, …) — implementation details called by public scripts. They are not intended to be invoked directly and are not referenced in `package.json`.

`package.json` scripts are reduced to the minimum set of public entry points:

```json
{
  "dev":             "bun run scripts/dev.ts",
  "tests":           "bun run scripts/test.ts",
  "build":           "bun scripts/build.ts",
  "start":           "bun run scripts/start.ts",
  "build:installer": "iscc installer.iss"
}
```

All public scripts begin with:

```ts
process.chdir(resolve(import.meta.dirname, "../"));
```

This ensures every tool invocation inside the script resolves paths relative to the app root, regardless of where `bun` was invoked from.

### `scripts/_env.ts` — Typed Environment Objects

`.env.local` and `.env.prod` files are replaced by a single private `scripts/_env.ts` that exports named, statically-typed environment objects:

```ts
import type { BuildConfig } from "../src/config/schemas.ts";

export const envLocalBuild: BuildConfig = {
  DZ_DAEMON_HOST: "127.0.0.1",
  DZ_DAEMON_PORT: 56499,
  // ...
};

export const envProdBuild: BuildConfig = {
  DZ_DAEMON_HOST: "127.0.0.1",
  DZ_DAEMON_PORT: 56499,
  // ...
};
```

The `BuildConfig` type is derived from the app's Zod `EnvConfig` schema (see `src/config/schemas.ts`), so TypeScript enforces that every required variable is present and correctly typed. Adding a new variable causes a compile error in `_env.ts` until all environment objects are updated.

### `scripts/build.ts` — Entry Point with Environment Selection

The public `build.ts` script selects the target environment (CI defaults to prod, non-TTY defaults to local, interactive TTY prompts), runs all quality gates, and delegates to `scripts/_build.ts`:

```ts
const env = IS_CI
  ? TargetEnvironment.Prod
  : !IS_TTY
    ? TargetEnvironment.Local
    : await select({ message: "Select build target:", choices: [...] });

await $`bunx depcheck`;
await $`bunx tsc --noEmit`;
await $`bunx biome check --write`;
await $`bun scripts/_build.ts`.env({
  ...z.record(z.string(), z.coerce.string()).parse(buildEnvs[env]),
  ...process.env,
});
```

Quality gates (`depcheck`, `tsc`, `biome`) run unconditionally before the build step, ensuring they cannot be skipped.

### `scripts/_build.ts` — Build Implementation

The private `_build.ts` performs the actual `Bun.build()` call. It receives env vars from the parent process (injected by `build.ts`) and embeds them into the compiled binary using `BuildEnv.dump()` from `@packages/dz-config`:

```ts
await Bun.build({
  // ...
  define: {
    ...BuildEnv.dump(BuildConfig, process.env),
  },
});
```

This replaces the previous `_BUILD_DZ_ENV: JSON.stringify(env)` pattern with the validated `BuildEnv.dump()` utility, which validates the env against the schema before serialising.

### `src/config/schemas.ts` and `src/config/index.ts`

The root-level `env.ts` and `src/AppConfig.ts` files are replaced by a `src/config/` module:

- **`src/config/schemas.ts`** — defines `EnvConfig`, `BuildConfig`, and `AppConfig` Zod schemas in one place.
- **`src/config/index.ts`** — loads the build-time snapshot via `BuildEnv.load()`, merges with `process.env` (for dev mode), parses through `EnvConfig`, and maps to the domain-friendly `AppConfig`:

```ts
const buildEnv: BuildConfig | undefined = BuildEnv.load(BuildConfig);
const env: EnvConfig = EnvConfig.parse({ ...buildEnv, ...process.env });

export const appConfig = AppConfig.parse({
  host: env.DZ_DAEMON_HOST,
  // ...
});
```

This works correctly in both compiled binaries (build env embedded via `define`) and development (env injected into the child process by `scripts/dev.ts`).

## Do's and Don'ts

### Do

- **Do** name implementation scripts with a leading underscore (`_build.ts`, `_env.ts`) to signal they are not public entry points.
- **Do** start every public script with `process.chdir(resolve(import.meta.dirname, "../"))` so tool paths resolve from the app root.
- **Do** include `depcheck`, `tsc`, and `biome` inside `scripts/build.ts` so quality gates are never skipped.
- **Do** type all env objects in `_env.ts` against `BuildConfig` so TypeScript enforces completeness.
- **Do** use `BuildEnv.dump(BuildConfig, process.env)` in `_build.ts` rather than `JSON.stringify` directly.

### Don't

- **Don't** add new `package.json` scripts for individual quality tools (`tsc`, `biome`, `depcheck`) — fold them into the relevant public script.
- **Don't** use `--env-file` flags in `package.json` scripts — inject env via `.env()` from the public script instead.
- **Don't** create `.env.local` or `.env.prod` files — define env values as typed objects in `scripts/_env.ts`.
- **Don't** reference private scripts (underscore-prefixed) directly from `package.json`.

## Consequences

### Positive

- **Compile-time completeness check** — missing or mistyped env variables are caught by TypeScript at authoring time rather than at runtime or CI.
- **Unforgettable quality gates** — `depcheck`, `tsc`, and `biome` are embedded in `build.ts` and cannot be bypassed by running a narrower script.
- **Reduced `package.json` surface** — 4 scripts instead of 9; the distinction between public entry points and implementation details is structurally enforced by the naming convention.
- **No file-flag coupling** — removing an env variable requires only updating `_env.ts` and the schema; no `package.json` script flags to chase.

### Negative

- **`@inquirer/prompts` dev dependency** — the interactive environment selection in `build.ts` requires this package in all apps that use it.
- **Less familiar** — developers accustomed to `.env` files need to learn that environment values live in `scripts/_env.ts`.

### Risks

- **`process.env` leakage** — passing `...process.env` when injecting the selected env into the child process means any variable already in the shell environment can shadow the typed values. This is intentional (enables CI override) but should be documented at the call site.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

## References

- ARC-002 — Unified Build-Time and Runtime Environment Variable Resolution (partially superseded)
- [Bun Shell `$`](https://bun.sh/docs/runtime/shell)
- [Bun `define` option](https://bun.sh/docs/bundler/api#define)
- [`@inquirer/prompts`](https://github.com/SBoudrias/Inquirer.js)
