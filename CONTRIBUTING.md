# Contributing to DCS Dropzone

Welcome, and thank you for your interest in contributing! This guide covers everything you need to get a productive local development environment up and running and to submit high-quality changes.

> **Stuck?** Open an issue or join [our Discord](https://discord.gg/bT7BEHn5RD) — we are happy to help.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Running the Stack Locally](#running-the-stack-locally)
5. [Development Commands](#development-commands)
6. [Code Style & Formatting](#code-style--formatting)
7. [Architecture Principles](#architecture-principles)
8. [Testing](#testing)
9. [Error Handling](#error-handling)
10. [Commit Conventions](#commit-conventions)
11. [Pre-Commit Checklist](#pre-commit-checklist)
12. [Pull Request Process](#pull-request-process)
13. [Common Pitfalls](#common-pitfalls)

---

## Prerequisites

| Tool | Purpose | Notes |
|------|---------|-------|
| [Bun](https://bun.sh/) ≥ 1.3.5 | Runtime, package manager, test runner | **Required — do not use npm/yarn/pnpm** |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs MongoDB for the Webapp | Required only if working on the Webapp |
| [Inno Setup](https://jrsoftware.org/isinfo.php) | Builds the Windows installer | Required only for installer builds |
| Windows OS | CI target; some binaries are Windows-only | Recommended for full-stack testing |

> **Inno Setup PATH note:** `winget install jrsoftware.innosetup` does not add `iscc` to PATH automatically.  
> After installing, add `C:\Users\<you>\AppData\Local\Programs\Inno Setup 6` to your PATH and restart your terminal.

---

## Getting Started

```sh
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/dcs-dropzone.git
cd dcs-dropzone

# 2. Install all workspace dependencies (always run this after pulling changes)
bun install
```

That's it — no extra build steps are needed to start developing.

---

## Project Structure

```
dcs-dropzone/
├─ apps/
│  ├─ daemon/     # Client-side Daemon: installs releases, manages symlinks, serves local API + webview
│  ├─ launcher/   # Updater: downloads and launches the correct Daemon version
│  └─ webapp/     # Server-side Web Application: publish, browse, enable/disable mods
├─ packages/
│  ├─ clients/    # Generated API clients (Orval)
│  ├─ cloudflare/ # Cloudflare Worker (edge)
│  ├─ dz-config/  # Shared config schemas
│  ├─ dzui/       # Shared React UI components
│  ├─ hono/       # Shared Hono utilities
│  ├─ manifest/   # Release manifest helpers
│  ├─ queue/      # Single-instance job queue library
│  └─ zod/        # Shared Zod schemas and validators
├─ scripts/       # Root-level build/test helpers
├─ tests/         # Playwright end-to-end tests
├─ biome.json     # Linting and formatting config
├─ bunfig.toml    # Bun test / install config
└─ package.json   # Root workspace config
```

### Key configuration files

| File | Purpose |
|------|---------|
| `biome.json` | Code style: tabs, 120-char line width, LF endings, double quotes |
| `bunfig.toml` | Test coverage (text + lcov), JUnit output (`unit.junit.xml`) |
| `.editorconfig` | Editor defaults: LF, UTF-8, 120-char max |
| `tsconfig.json` | Per-workspace TypeScript configs (strict mode) |
| `.archgate/adrs/` | Architecture Decision Records (ADRs) — read these before writing code |

---

## Running the Stack Locally

See **[docs/local-development.md](docs/local-development.md)** for the full step-by-step walkthrough covering:

- Building and serving the Daemon archive
- Building and running the Launcher
- Building the Windows installer
- Running the Webapp (Docker Compose or hot-reload dev mode)

### Environment files

Each app ships two checked-in `.env` files. Scripts pick the right one automatically:

| Script | Env file loaded |
|--------|----------------|
| `bun run dev` | `.env.local` |
| `bun run build` | `.env.prod` |
| `bun run build:local` | `.env.local` |
| `bun test` (root) | All `.env.local` files |

You should rarely need to edit these files. If you need a personal override, copy `.env.local` and keep it out of version control.

---

## Development Commands

> Always run commands from the **repository root** unless noted otherwise.

### Day-to-day development

```sh
bun run daemon:dev      # Run Daemon in watch mode (no compile, directly from source)
bun run launcher:dev    # Run Launcher in watch mode
bun run webapp:dev      # Run Webapp with hot-reload (requires Docker for MongoDB)
```

### Testing

```sh
bun test                            # Run all tests with coverage
cd apps/daemon && bun test          # Run Daemon tests only
cd apps/webapp && bun test          # Run Webapp tests only
```

Coverage reports are written as `lcov` and printed as text. A JUnit report is saved to `unit.junit.xml` at the root.

### Linting & type checking

```sh
# Run in any workspace (daemon, webapp, or a package)
bun run biome    # Format and lint with Biome (~500ms)
bun run tsc      # Type check with TypeScript
```

Both must pass cleanly before opening a PR. Run them in the workspaces you have changed.

### Building

```sh
bun run daemon:build        # Compile Daemon binary + release archive
bun run launcher:build      # Compile Launcher executable
bun run webapp:build        # Compile Webapp binary
bun run installer:build     # Package Launcher into a Windows installer (needs iscc)
bun run build               # Build everything in sequence
```

---

## Code Style & Formatting

All formatting is enforced by [Biome](https://biomejs.dev/). The key rules are:

| Rule | Value |
|------|-------|
| Indentation | **Tabs** (not spaces) |
| Line width | **120 characters** |
| Line endings | **LF** |
| Quotes | **Double quotes** |
| Final newline | Required |

**Run `bun run biome` in your changed workspace before committing.** Biome will auto-fix most issues.

### TypeScript

- Strict type checking is enabled in every workspace.
- `any` and non-null assertions (`!`) are allowed where genuinely appropriate — do not abuse them.
- Prefer Go-style error tuples (`[T, null] | [undefined, E]`) over exceptions for recoverable failures (see [Error Handling](#error-handling)).
- Prefer `ts-pattern` for exhaustive pattern matching over long `if/else` or `switch` chains.

---

## Architecture Principles

This codebase follows **Hexagonal Architecture (Ports & Adapters)**. Understanding this is essential before contributing.

> Full details are in the ADRs under [`.archgate/adrs/`](.archgate/adrs/). Read them.

### The core idea

```
         ┌─────────────────────────┐
         │   Application / Domain  │
         │                         │
         │  Services  ←  Ports     │
         │  (business logic)       │
         └──────────┬──────────────┘
                    │ interface only
         ┌──────────▼──────────────┐
         │   Adapters (Infra)      │
         │  DB, HTTP, File System  │
         └─────────────────────────┘
```

- **Ports** are TypeScript interfaces (e.g., `UserRepository`, `FileSystem`).
- **Adapters** are concrete implementations (e.g., `MongoUserRepository`, `BunFileSystem`).
- **Application/Service classes** depend only on port interfaces — never on adapters directly.
- **Wiring** happens in `ProdApplication.ts` (production) or in test setup files (`TestApplication`).

### Function design (GEN-002)

Every function must fit one archetype — do not mix concerns:

| Archetype | Scope | Purity | Direction |
|-----------|-------|--------|-----------|
| Transformer / Builder / Validator | Leaf | Pure | Query |
| Reader | Leaf | Effectful | Query |
| Writer | Leaf | Effectful | Command |
| Orchestrator | Orchestration | Inherited | Inherited |

**If a function spans multiple archetypes, split it.** Orchestrators must not call runtime APIs directly — wrap them in named leaf functions first.

---

## Testing

### Test file conventions

| Location | Style | When to use |
|----------|-------|-------------|
| `src/Thing.test.ts` (co-located) | **Mockist** | Port Adapters (Repositories, File Systems) and pure functions with no side effects |
| `src/__tests__/UseCase.test.ts` | **Sociable** | Application/Use Case layer — real service collaborators, Test Double adapters |

### Naming conventions

- Test doubles use a `Test` prefix: `TestUserRepository`, `TestFileSystem`.
- Use nested `describe` blocks with descriptive names.
- Write assertions using `expect()`.

### Prefer Sociable tests

Sociable tests exercise the full business logic path through real service collaborators while swapping only the infrastructure adapters (database, file system, HTTP). This gives high coverage without crystallizing internal implementation details.

Reserve Mockist tests for Port Adapters and true pure functions.

### End-to-end (Playwright) tests

E2E tests live under `tests/` and use Playwright. The full conventions are in [`.archgate/adrs/TEST-006-adoption-of-playwright-for-e2e-testing.md`](.archgate/adrs/TEST-006-adoption-of-playwright-for-e2e-testing.md) and the [`playwright-tests` skill](.claude/skills/playwright-tests/SKILL.md). The non-negotiables:

- **Locate elements by `data-testid`, not by text.** Add new IDs to `packages/testids/src/index.ts` and reference them from both the component and the spec. Text-based locators (`getByText`, `getByRole({ name })`) are fragile across i18n, refactors, and locale changes — they pass locally and fail in CI.
- **Never use `page.waitForTimeout()`.** It is always either too slow or a race. Use web-first assertions (`toBeVisible`, `toHaveCount`, `toHaveURL`, etc.) — they auto-settle with the right timeouts.
- **Always run E2E tests with the project flag**, e.g. `bunx playwright test tests/webapp/UI_WebappUserMods.spec-pw.ts --project=webapp`. The `webapp` and `daemon` projects have different webServer configs and cannot be mixed in a single run.

### Running tests

```sh
bun test              # All workspaces
bun test --watch      # Re-run on file change
```

---

## Error Handling

This project uses Go-style error tuples for all recoverable errors (see [GEN-005](.archgate/adrs/GEN-005-errors-as-values-go-style-tuples.md)). **Do not throw exceptions for expected business logic failures.**

### The rule (GEN-005)

| Situation | Tool |
|-----------|------|
| Expected, recoverable failure (file not found, validation, network timeout) | Return `[T, null] \| [undefined, CustomError]` tuple |
| Contract violation / programming bug / unreachable state | `throw` |

### Error type requirements

Every error returned in a tuple must be a **class extending `Error`**:

```ts
// ✅ Correct
class ConfigNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Config file not found: ${path}`);
    this.name = "ConfigNotFoundError";
  }
}

function readConfig(path: string): [Config, null] | [undefined, ConfigNotFoundError] { ... }

// ❌ Incorrect — plain string errors
return [undefined, "config not found"];

// ❌ Incorrect — generic Error without a custom class
return [undefined, new Error("config not found")];
```

Callers destructure the tuple and use `if (err)` with early returns. Use `instanceof` to narrow specific error types.

---

## Commit Conventions

This project uses **[Conventional Commits](https://www.conventionalcommits.org/)** with **semantic-release** to automate versioning and changelogs. Every commit on `main` that matches the format triggers a release.

### Format

```
<type>(<scope>): <subject>

Changes:
- <bullet>
- <bullet>
```

- **type**: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`
- **scope**: the exact `"name"` field from the affected package's `package.json` (e.g., `@dcs-dropzone/daemon`)
- **subject**: imperative mood, ≤ 72 characters, no trailing period
- **body**: include a `Changes:` bullet list for anything non-trivial (3–7 bullets)
- **breaking changes**: add `!` after the type/scope and include a `BREAKING CHANGE:` footer

### Examples

```
feat(@dcs-dropzone/daemon): add symlink validation on startup

Changes:
- Validate all existing symlinks on daemon start
- Remove stale symlinks pointing to missing releases
- Log warnings for each removed symlink
```

```
fix(@dcs-dropzone/webapp): correct mod enable state after page refresh
```

```
feat!(@dcs-dropzone/daemon): rename config file from .toml to .yaml

BREAKING CHANGE: The daemon configuration file has been renamed from
dzConfig.toml to dzConfig.yaml. Users must rename their config files.
```

---

## Pre-Commit Checklist

Before pushing or opening a PR, verify:

- [ ] `bun install` has been run if any dependencies changed
- [ ] `bun test` passes with no failures
- [ ] `bun run biome` passes in every affected workspace
- [ ] `bun run tsc` passes in every affected workspace
- [ ] No unintended files are staged (check `.gitignore`)
- [ ] Commit messages follow Conventional Commits format
- [ ] New public functions/classes have JSDoc comments where non-obvious
- [ ] New Port Adapter implementations have co-located Mockist tests
- [ ] New Application/Use Case paths have Sociable tests in `src/__tests__/`

---

## Pull Request Process

1. **Fork & branch** — create a branch from `main` with a descriptive name (e.g., `feat/symlink-validation`).
2. **Keep PRs focused** — one logical change per PR makes review faster and reduces merge risk.
3. **Fill in the PR description** — explain *what* changed and *why*, link any related issues.
4. **Ensure CI is green** — the GitHub Actions workflow runs `bun test` on Windows; all checks must pass.
5. **Address review feedback** — push fixes as new commits; avoid force-pushing during review.
6. **Squash or rebase** — maintainers may squash on merge to keep history clean.

---

## Common Pitfalls

### Always use Bun — never npm/yarn/pnpm

```sh
# ✅
bun install
bun add <package>
bun test

# ❌  Never use these
npm install
yarn add
pnpm install
```

### Run `bun install` after pulling

Workspace dependencies use the `workspace:*` protocol. After any pull or merge, run `bun install` to keep everything in sync.

### Windows binaries must be present for tests

The Daemon tests require Windows binaries in `apps/daemon/bin/`:

- `wget.exe`
- `7za.exe`, `7za.dll`, `7zxa.dll`

These are committed to the repository and must not be deleted. If tests fail with a "binary not found" error, check this directory.

### Depcheck crashes on Bun 1.3.5+

Running `bunx depcheck` may crash with `"Assertion failure: Expected metadata to be set"`. This is a known Bun compatibility issue. Skip it and run checks separately:

```sh
cd apps/webapp && bun run biome && bun run tsc
cd apps/daemon && bun run biome && bun run tsc
```

### `webapp:dev` fails with `EADDRINUSE` on port 3000

The Webapp dev server binds port 3000. If a previous `bun run webapp:dev` was killed without releasing the port — or if a `bun --hot` process was orphaned (parent PID `1`) — a fresh start will fail with:

```
error: Failed to start server. Is port 3000 in use?
code: "EADDRINUSE"
```

Find and kill the holder before retrying:

```sh
lsof -i :3000          # identify the PID
kill <pid>             # graceful first; SIGKILL only if it ignores SIGTERM
```

Playwright tests against the Webapp use the same port via `webServer` config, so this also surfaces as `Process from config.webServer was not able to start` in test runs.

### LF line endings

The project enforces LF line endings (`.editorconfig`, Biome). If you are on Windows, configure Git to **not** auto-convert line endings:

```sh
git config core.autocrlf false
```

Or set this globally once: `git config --global core.autocrlf false`.

