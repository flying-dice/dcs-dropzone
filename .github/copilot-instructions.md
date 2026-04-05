# DCS Dropzone - Copilot/Agent Instructions

## Repository Overview

**DCS Dropzone** is a mod manager system for DCS World (Digital Combat Simulator) consisting of a daemon application, a web application, and a launcher. The project is a Bun monorepo using TypeScript with three main applications and eight shared packages.

- **Size**: Medium-sized TypeScript monorepo (~300 source files)
- **Runtime**: Bun v1.3.5+ (NOT Node.js)
- **Language**: TypeScript with strict type checking
- **Framework**: Hono (web framework), React 19 (frontend), Drizzle ORM (daemon), Mongoose (webapp)
- **Architecture**: Ports & Adapters pattern, monorepo workspace structure

## Project Structure

```
/
├── apps/
│   ├── daemon/        # Client-side daemon for DCS mod management
│   │   ├── src/
│   │   ├── bin/       # Third-party binaries (wget.exe, 7za.exe, etc.)
│   │   ├── drizzle.config.ts
│   │   ├── scripts/
│   │   └── package.json
│   ├── launcher/      # Updater that downloads and runs the daemon
│   │   ├── src/
│   │   ├── scripts/
│   │   └── package.json
│   └── webapp/        # Server-side web UI for mod browsing and management
│       ├── src/
│       ├── scripts/
│       └── package.json
├── packages/
│   ├── clients/       # Generated API clients (Orval) for daemon & webapp
│   ├── cloudflare/    # Cloudflare worker deployment
│   ├── dz-config/     # Configuration utilities with Zod
│   ├── dzui/          # Shared React UI components & i18n
│   ├── hono/          # Shared Hono utilities and middleware
│   ├── manifest/      # Manifest format definitions
│   ├── queue/         # Job queue library (single-instance only)
│   └── zod/           # Shared Zod schemas and validators
├── biome.json         # Code formatting and linting config
├── bunfig.toml        # Bun configuration
└── package.json       # Root workspace config
```

### Key Configuration Files

- **biome.json**: Linting and formatting (tabs, 120 char line width, double quotes)
- **bunfig.toml**: Test coverage config (text + lcov), JUnit output (unit.junit.xml)
- **tsconfig.json**: Per-workspace TypeScript configs
- **.editorconfig**: LF line endings, UTF-8, 120 char max line length

## Build & Development Commands

### CRITICAL: Always Use Bun, Never npm/yarn/pnpm

This project uses **Bun exclusively**. Do NOT use npm, yarn, or pnpm commands.

### Installation

```bash
bun install
```

**ALWAYS run `bun install` after pulling changes or before any build/test operations.**

### Testing

```bash
# Run all tests (from root)
bun run tests

# Run workspace-specific tests
cd apps/webapp && bun run tests
cd apps/daemon && bun run tests
```

- Tests use Bun's built-in test runner via workspace scripts
- Coverage reports generate `unit.junit.xml` at root
- Tests take ~11 seconds total

### Linting & Type Checking

```bash
# Run checks in specific workspaces (run from within workspace directory)
cd apps/webapp && bun run biome    # Format and lint with Biome
cd apps/webapp && bun run tsc      # Type checking with TypeScript
cd apps/daemon && bun run biome
cd apps/daemon && bun run tsc
```

- Both biome and tsc should pass cleanly
- depcheck may have issues, skip this and allow it to be maintained separately

### Development Servers

```bash
# Start webapp dev server
bun run webapp:dev
# Or: cd apps/webapp && bun run dev

# Start daemon dev server
bun run daemon:dev
# Or: cd apps/daemon && bun run dev

# Start launcher dev
bun run launcher:dev
# Or: cd apps/launcher && bun run dev
```

### Building

```bash
# Build all workspaces (webapp, daemon, launcher)
bun run build

# Build a specific workspace
cd apps/webapp && bun run build
cd apps/daemon && bun run build
cd apps/launcher && bun run build

# Serve the daemon build locally (for launcher testing)
cd apps/daemon && bun run build:serve
```

The daemon build script bundles the app with third-party binaries (wget.exe, 7za.exe) into `dist/daemon/`.

## CI/CD Pipeline

**GitHub Actions Workflow**: `.github/workflows/test.yml`

- **Platform**: Windows (windows-latest runner)
- **Trigger**: On every push
- **Steps**:
  1. Checkout code
  2. Install Bun
  3. Cache Bun downloads (`bun.lockb` hash key)
  4. `bun install`
  5. Add `apps/daemon/bin` to PATH (for wget/7zip binaries)
  6. `bun run build` (builds all workspaces)
  7. `bun run tests` (runs all tests)
  8. Upload logs/ directory as artifact
  9. Upload build artifacts (daemon tar, manifest, launcher exe, setup installer)
  10. Publish JUnit test report from `unit.junit.xml`

**Key CI Requirements**:
- Windows binaries (wget.exe, 7za.exe) must be in `apps/daemon/bin/`
- Tests must generate `unit.junit.xml` at root
- Always ensure `bun run build && bun run tests` passes before pushing

## Code Style & Conventions

### Formatting (Biome)

- **Indentation**: Tabs (NOT spaces)
- **Line Width**: 120 characters
- **Line Ending**: LF
- **Quotes**: Double quotes for strings
- **Final Newline**: Required

### TypeScript Rules

- Strict type checking enabled
- `noExplicitAny`: off (explicit any allowed)
- `noNonNullAssertion`: off (! operator allowed)
- Use Go-style tuple pattern for error handling (`[T, null] | [undefined, E]`) as per GEN-005
- Prefer functional patterns with ts-pattern for control flow

### Testing Conventions

- Test files: `*.test.ts` (co-located with source for mockist testing (Mock dependencies))
- Test files: `src/__tests__/*.test.ts` for Sociable tests (real dependencies, but Test Doubles for Port Adapters)
- Use descriptive test names with nested describes
- Mock implementations use "Test" prefix (e.g., `TestFileSystem`, `TestRepository`)
- Use `expect()` for assertions
- Prefer the use of Sociable tests for coverage, use Mockist tests for Port Adapters i.e. Repositories, File Systems
- Avoid the use of Mockist style tests unless it's a Pure Function with no side effects, avoid crystallizing the implementation of collaborators.
- The use of Hexagonal Architecture (Ports & Adapters) is strongly enforced to enable:
  - Mockist testing of Port Adapters.
  - Sociable testing of the 'Application' API covering the entire business logic used in that use case.

### Architecture Patterns

- **Ports & Adapters**: Separate interfaces (ports) from implementations (adapters)
- **Repository Pattern**: Used for data access (e.g., `JobRepo`, `ModRepository`)
- **Service Layer**: Business logic in service classes (e.g., `UserMods`, `PublicMods`)
- **Error Pattern**: Use Go-style tuples (`[T, null] | [undefined, E]`) for error handling instead of exceptions

## Common Pitfalls & Workarounds

### 1. Depcheck Failures

**Symptom**: `bunx depcheck` crashes with "Assertion failure: Expected metadata to be set"

**Workaround**: Run checks separately:
```bash
cd apps/webapp && bun run biome && bun run tsc
cd apps/daemon && bun run biome && bun run tsc
```

Skip `bunx depcheck` if it crashes - this is a Bun compatibility issue.

### 2. Windows-Specific Binary Requirements

The daemon requires Windows binaries in `apps/daemon/bin/`:
- `wget.exe` (7MB)
- `7za.exe`, `7za.dll`, `7zxa.dll` (1.9MB total)

These are bundled with the built daemon and must exist for tests to pass.

### 3. Database Configuration

- **Daemon**: SQLite via Drizzle ORM (`apps/daemon/drizzle.config.ts`)
  - Migrations in `apps/daemon/src/database/ddl/`
  - Schema in `apps/daemon/src/database/ConfigSchema.ts`
- **Webapp**: MongoDB via Mongoose
  - In-memory MongoDB for tests (`mongodb-memory-server`)
  - Connection string parsing in `apps/webapp/src/database/MongoUrl.ts`

### 4. Workspace Dependencies

Packages reference each other using `workspace:*` protocol:
```json
"@packages/hono": "workspace:*"
"@packages/queue": "workspace:*"
```

Always run `bun install` after adding workspace dependencies.

### 5. API Client Generation

The `packages/clients` package uses Orval (`orval.config.cjs`) to generate typed API clients from OpenAPI schemas. Regenerate clients after changing the API schema.

## Validation Checklist

Before committing changes, ALWAYS:

1. ✅ Run `bun install` if dependencies changed
2. ✅ Run `bun run build` to ensure all workspaces build
3. ✅ Run `bun run tests` to ensure all tests pass
4. ✅ Run `bun run biome` in affected workspaces to check formatting
5. ✅ Run `bun run tsc` in affected workspaces to check types
6. ✅ Verify no unintended files are staged (check `.gitignore`)
7. ✅ Ensure changes work on Windows (CI target platform)
8. ✅ **If you modified any files under `docs/`**, run `bun run docs:build` to verify there are no dead links or build errors before committing

## Additional Notes

- **Job Queue**: The `@packages/queue` library is for single-instance use only (no distributed locking)
- **React Version**: Uses React 19 (latest)
- **UI Framework**: Mantine 8.3.10 for React components, see documentation https://mantine.dev/llms.txt
- **Internationalization**: i18next with browser language detection (in `@packages/dzui`)
- **Drag & Drop**: @dnd-kit libraries for UI interactions
- **Monaco Editor**: Code editor component (@monaco-editor/react)
- **Cloudflare**: The `packages/cloudflare` workspace is excluded from the default `build` and `tests` runs (use `webapp:deploy` for it)

## Trust These Instructions

These instructions were generated by thorough exploration and validation of the repository. Trust them first, and only search or explore if information is missing or found to be incorrect.
