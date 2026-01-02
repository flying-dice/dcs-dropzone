# DCS Dropzone

A modern mod manager for DCS World that makes it easy to discover, download, and manage your favorite mods.

## 📦 Monorepo Structure

This project uses a monorepo structure organized with Bun workspaces:

```
dcs-dropzone/
├── apps/                    # Applications
│   ├── webapp/             # Web application (frontend + build)
│   └── daemon/             # Daemon service for downloads & installations
├── packages/               # Shared packages
│   ├── hono/              # Shared Hono utilities and middleware
│   └── zod/               # Shared Zod schemas for validation
├── docs/                   # Technical documentation
└── package.json           # Root workspace configuration
```

### Apps

- **webapp**: The web application that provides the UI for browsing and managing mods. Built with React, Hono build, and MongoDB.
- **daemon**: The daemon service that runs locally to handle downloading, extracting, and installing mods into your DCS World installation.

### Packages

- **@packages/hono**: Shared Hono utilities, middleware, and build components used across applications.
- **@packages/zod**: Shared Zod schemas for data validation and type safety across the monorepo.

## 🚀 Getting Started

### For Users

1. Visit **[https://dcs-dropzone.app/](https://dcs-dropzone.app/)** to browse available mods
2. Download the latest daemon from the [Releases](https://github.com/flying-dice/dcs-dropzone/releases) page
3. Extract the daemon to a folder of your choice
4. Run the daemon - it will handle all downloads and installations automatically

**Note:** All downloaded mods will be installed into the folder where you extracted the daemon.

### What You Get

- 🔍 **Discover Mods** - Browse a curated registry of DCS World mods
- ⬇️ **Easy Downloads** - Automatic downloading and installation
- 🔄 **Stay Updated** - Get notified when your mods have updates
- 🎯 **Simple Management** - Enable, disable, and remove mods with ease

## 📚 Documentation

For developers and contributors, technical documentation is available in the [`docs/`](./docs) folder:

- [Command-Query Pattern](./docs/command-query-pattern.md) - Server architecture pattern
- [Download Queue System](./docs/download-queue-system.md) - Download management
- [Extract Queue System](./docs/extract-queue-system.md) - Archive extraction

## 🔧 Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- DCS World installation (for testing the daemon)

### Setup

This is a Bun workspace monorepo. All dependencies are managed at the workspace level.

1. Clone the repository:
```bash
git clone https://github.com/flying-dice/dcs-dropzone.git
cd dcs-dropzone
```

2. Install dependencies for all workspace packages:
```bash
bun install
```

This will install dependencies for the root workspace and all apps and packages.

### Running Development Servers

Each build can be run independently:

```bash
# Web application (runs on default port)
bun run dev:webapp

# Daemon service (in another terminal)
bun run dev:daemon
```

### Working with the Monorepo

**Workspace Commands**: Commands can be run across all workspaces:

```bash
# Run checks (linting + type checking) across all workspaces
bun run check

# Run tests across all workspaces
bun run test
```

**Working on Individual Apps/Packages**: Navigate to the specific directory:

```bash
# Work on webapp
cd apps/webapp
bun run dev          # Start dev build
bun run check        # Lint and type-check
bun run test         # Run tests

# Work on daemon
cd apps/daemon
bun run dev          # Start daemon
bun run build        # Build daemon executable
```

**Shared Packages**: The `packages/` directory contains code shared between apps:
- Changes to `@packages/hono` or `@packages/zod` are immediately available to apps (no build step needed)
- TypeScript references ensure type-checking works across package boundaries

### Building

Build individual apps:

```bash
# Build web application
cd apps/webapp
bun run build

# Build daemon executable
cd apps/daemon
bun run build
```

### Testing

```bash
# Run all tests across the monorepo
bun run test

# Run tests for a specific build/package
cd apps/webapp
bun test
```

### Code Quality

The monorepo uses Biome for linting and formatting:

```bash
# Check and fix all workspaces
bun run check

# Check a specific build/package
cd apps/webapp
bun run check
```

See the [docs/](./docs) folder for detailed technical documentation.

## 🤝 Contributing

Contributions are welcome! This project uses a monorepo structure with Bun workspaces.

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/dcs-dropzone.git`
3. Install dependencies: `bun install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

### Development Guidelines

- **Code Quality**: Run `bun run check` before committing to ensure code passes linting and type-checking
- **Testing**: Add tests for new features and ensure `bun run test` passes
- **Monorepo Structure**:
  - Apps go in `apps/` (self-contained applications)
  - Shared code goes in `packages/` (reusable utilities and schemas)
  - Keep dependencies at the workspace level when possible
- **Commits**: Use clear, descriptive commit messages

### Making Changes

**For App-Specific Changes** (e.g., webapp or daemon):
- Work in the relevant `apps/` directory
- Test changes locally with `bun run dev`
- Run `bun run check` and `bun test` in the build directory

**For Shared Package Changes** (e.g., hono or zod packages):
- Work in the relevant `packages/` directory
- Changes are immediately reflected in dependent apps
- Run checks across all workspaces: `bun run check` from root

**Adding Dependencies**:
- Shared dependencies: Add to root `package.json`
- App-specific dependencies: Add to the build's `package.json`
- Package-specific dependencies: Add to the package's `package.json`

### Submitting Changes

1. Ensure all checks pass: `bun run check && bun run test`
2. Commit your changes
3. Push to your fork
4. Open a Pull Request with a clear description of your changes

Please feel free to submit a Pull Request or open an issue for discussion.

## 📄 License

This project is private. All rights reserved.

## 🙏 Acknowledgments

- DCS World by Eagle Dynamics
- The DCS modding community
