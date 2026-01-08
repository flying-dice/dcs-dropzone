# DCS Dropzone - Copilot Instructions

## Repository Overview

**DCS Dropzone** is a mod manager system for DCS World (Digital Combat Simulator) consisting of a daemon application and a web application. The project is a Bun monorepo using TypeScript with two main applications and four shared packages.

- **Size**: Medium-sized TypeScript monorepo (~300 source files)
- **Runtime**: Bun v1.3.5+ (NOT Node.js)
- **Language**: TypeScript with strict type checking
- **Framework**: Hono (web framework), React 19 (frontend), Drizzle ORM (daemon), Mongoose (webapp)
- **Architecture**: Ports & Adapters pattern, monorepo workspace structure

## Project Structure

```
/
├── apps/
│   ├── daemon/        # Backend daemon for DCS mod management
│   │   ├── src/
│   │   ├── bin/       # Third-party binaries (wget.exe, 7za.exe, etc.)
│   │   ├── config.toml
│   │   ├── build-daemon.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── webapp/        # Web UI for mod management
│       ├── src/
│       ├── orval.config.cjs
│       └── package.json
├── packages/
│   ├── decorators/    # Shared decorators (e.g., @Log)
│   ├── hono/          # Shared Hono utilities
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
# Run all tests with coverage
bun test

# Run workspace-specific tests
cd apps/webapp && bun test
cd apps/daemon && bun test
```

- Tests use Bun's built-in test runner
- Coverage reports generate `unit.junit.xml` at root
- Tests take ~11 seconds total
- 184 tests across 21 files with 96%+ coverage

### Linting & Type Checking

```bash
# Check all workspaces (runs biome + tsc + depcheck in each)
bun run check

# Workspace-level commands (run from root or within workspace)
bun run biome      # Format and lint with Biome
bun run tsc        # Type checking with TypeScript
bunx depcheck      # Check for unused dependencies

# Run checks in specific workspaces
cd apps/webapp && bun run biome    # Fast: ~863ms
cd apps/webapp && bun run tsc      # Type checking only
cd apps/daemon && bun run biome    # Fast: ~478ms
cd apps/daemon && bun run tsc
```

**WARNING**: The `bun run check` command may fail with `depcheck` crashes due to Bun 1.3.5 compatibility issues. This is a known issue. If it fails:
- Run `bun run biome` and `bun run tsc` separately in each workspace instead
- Both biome and tsc should pass cleanly
- Skip `bunx depcheck` if it crashes - this is a known Bun compatibility issue

### Development Servers

```bash
# Start webapp dev server
bun run dev:webapp
# Or: cd apps/webapp && bun run dev

# Start daemon dev server  
bun run dev:daemon
# Or: cd apps/daemon && bun --watch src/index.ts
```

### Building

```bash
# Build webapp (creates compiled binary)
cd apps/webapp && bun run build

# Build daemon (creates compiled binary with assets)
cd apps/daemon && bun run build
```

The daemon build script (`build-daemon.ts`) bundles the app with third-party binaries (wget.exe, 7za.exe) into `dist/daemon/`.

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
  6. `bun test` (runs all tests)
  7. Upload logs/ directory as artifact
  8. Publish JUnit test report from `unit.junit.xml`

**Key CI Requirements**:
- Windows binaries (wget.exe, 7za.exe) must be in `apps/daemon/bin/`
- Tests must generate `unit.junit.xml` at root
- Always ensure `bun test` passes before pushing

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
- Use `neverthrow` Result types for error handling (ok/err pattern)
- Prefer functional patterns with ts-pattern for control flow

### Testing Conventions

- Test files: `*.test.ts` (co-located with source)
- Use descriptive test names with nested describes
- Mock implementations use "Test" prefix (e.g., `TestFileSystem`, `TestRepository`)
- Use `expect()` for assertions
- Async test support with proper cleanup

### Architecture Patterns

- **Ports & Adapters**: Separate interfaces (ports) from implementations (adapters)
- **Repository Pattern**: Used for data access (e.g., `JobRepo`, `ModRepository`)
- **Service Layer**: Business logic in service classes (e.g., `UserMods`, `PublicMods`)
- **Result Pattern**: Use `neverthrow` for error handling instead of exceptions

## Common Pitfalls & Workarounds

### 1. Depcheck Failures with Bun 1.3.5

**Symptom**: `bun run check` crashes with "Assertion failure: Expected metadata to be set"

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
  - Schema in `apps/daemon/src/database/schema.ts`
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

## Validation Checklist

Before committing changes, ALWAYS:

1. ✅ Run `bun install` if dependencies changed
2. ✅ Run `bun test` to ensure all tests pass
3. ✅ Run `bun run biome` in affected workspaces to check formatting
4. ✅ Run `bun run tsc` in affected workspaces to check types
5. ✅ Verify no unintended files are staged (check `.gitignore`)
6. ✅ Ensure changes work on Windows (CI target platform)

## Additional Notes

- **Job Queue**: The `@packages/queue` library is for single-instance use only (no distributed locking)
- **React Version**: Uses React 19 (latest)
- **UI Framework**: Mantine 8.3.10 for React components
- **Internationalization**: i18next with browser language detection
- **Drag & Drop**: @dnd-kit libraries for UI interactions
- **Monaco Editor**: Code editor component (@monaco-editor/react)

## Trust These Instructions

These instructions were generated by thorough exploration and validation of the repository. Trust them first, and only search or explore if information is missing or found to be incorrect.
