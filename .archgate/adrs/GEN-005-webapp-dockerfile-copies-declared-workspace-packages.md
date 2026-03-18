---
id: GEN-005
title: Webapp Dockerfile Must Copy Exactly the Declared Workspace Package Dependencies
domain: general
rules: true
---

## Context

The webapp is built inside a Docker multi-stage build (`apps/webapp/Dockerfile`). Because the project is a Bun workspace monorepo, the build stage must manually `COPY` each workspace package that the webapp depends on before running `bun install` and building the binary.

These workspace dependencies are declared in `apps/webapp/package.json` under `dependencies` as `@packages/*: workspace:*` entries.

There is no automatic mechanism that keeps the Dockerfile's `COPY` directives in sync with the webapp's declared workspace dependencies. When a developer adds a new `@packages/*` dependency to the webapp but forgets to add the corresponding `COPY` lines to the Dockerfile, the Docker build silently succeeds locally (where the files already exist on disk via the workspace) but fails in CI or produces a broken image.

The inverse problem also occurs: stale `COPY` directives for packages that were removed as dependencies remain in the Dockerfile, increasing build context size and creating confusion about which packages are actually needed.

## Decision

The Dockerfile for `apps/webapp` must copy **exactly** the workspace packages that are declared as direct `workspace:*` dependencies in `apps/webapp/package.json`. No more, no less.

### Rule

For every `@packages/<name>: workspace:*` entry in `apps/webapp/package.json`:

- The Dockerfile **must** contain a `COPY ./packages/<name>/src` directive.

For every `COPY ./packages/<name>/` directive in the Dockerfile:

- `@packages/<name>` **must** be listed as a `workspace:*` dependency in `apps/webapp/package.json`.

### Adding a new workspace package dependency

1. Add `@packages/<name>: workspace:*` to `apps/webapp/package.json`.
2. Add the necessary `COPY` directives for the package in `apps/webapp/Dockerfile` — at minimum `./packages/<name>/src`, `./packages/<name>/package.json`, and `./packages/<name>/tsconfig.json`. Include additional files (e.g. `bun-env.d.ts`, `i18n/`) only if required by the build.

### Removing a workspace package dependency

1. Remove the `@packages/<name>: workspace:*` entry from `apps/webapp/package.json`.
2. Remove all `COPY ./packages/<name>/` directives from `apps/webapp/Dockerfile`.

## Do's and Don'ts

### Do

- Keep the Dockerfile `COPY` directives and `apps/webapp/package.json` workspace dependencies in sync at all times.
- Run `archgate check` locally before opening a PR that touches either file.
- Copy only the files the build actually needs (src, package.json, tsconfig.json, and any build-time assets).

### Don't

- Don't add `COPY ./packages/<name>/` to the Dockerfile without also declaring `@packages/<name>: workspace:*` in the webapp's `package.json`.
- Don't leave stale `COPY` directives in the Dockerfile after removing a dependency.
- Don't copy entire package directories speculatively — only copy what the build step requires.

## Consequences

### Positive

- Docker build failures caused by missing workspace sources are caught before they reach CI.
- Dockerfile `COPY` directives serve as an accurate, machine-verified manifest of the webapp's local dependencies.
- Build context stays minimal — only the files the build actually needs are sent to the Docker daemon.

### Negative

- Developers must remember to update two files when adding or removing a workspace dependency.
- The automated check is file-content based and will not catch `COPY` directives for individual files within a package that are missing.

### Risks

- Packages with non-standard directory layouts (e.g. a package with an `i18n/` directory needed at build time) require extra `COPY` lines beyond the minimum set. The rule checks for the `src` directory as the canonical presence indicator, so extra asset directories will not be flagged as missing.

## Compliance and Enforcement

- The set of packages copied in the Dockerfile must match the set of `workspace:*` dependencies in `apps/webapp/package.json` — enforced by `archgate check`.
- Any PR that adds or removes a workspace dependency without updating the Dockerfile (or vice versa) will fail the architecture gate.

## References

- `apps/webapp/Dockerfile`
- `apps/webapp/package.json`
- ARC-001 — Adoption of Archgate CLI for Architectural Governance
