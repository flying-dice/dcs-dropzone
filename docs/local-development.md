# Local Development Guide

This guide walks through building and running the full Dropzone stack locally, end-to-end.

## Prerequisites

- [Bun](https://bun.sh/) installed and on your PATH
- [Inno Setup](https://jrsoftware.org/isinfo.php) installed (`iscc` on PATH) — needed for the installer
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — needed only if you want to run the webapp

Install all workspace dependencies from the repository root:

```sh
bun install
```

## Architecture

The stack has three applications that work together:

```
Webapp (optional)         Daemon                    Launcher
─────────────────         ──────                    ────────
Web UI for browsing       Desktop app that          Updater that downloads
and managing mods.        manages installations     and runs the correct
Runs in Docker or         and serves a local        version of the Daemon.
standalone.               API + webview UI.         Shipped via the installer.

localhost:3000            localhost:56499            Runs on demand
```

The **Launcher** downloads the **Daemon** archive from a release server (locally: `http-server` on port 8081), unpacks it, and starts it. The **Daemon** then runs and optionally communicates with the **Webapp**.

## Step-by-step: Full local build and run

### 1. Build the Daemon

Compile the Daemon into a standalone binary and release archive (`dcs-dropzone.tar`):

```sh
bun run daemon:build
```

This runs `apps/daemon/_build.ts` which:
- Compiles `apps/daemon/src/index.ts` into `apps/daemon/dist/Dropzone.exe`
- Bundles helper binaries (wget, 7za) into `dist/`
- Packages everything into `apps/daemon/dist/dcs-dropzone.tar` with a `.manifest` file

### 2. Serve the Daemon build locally

The Launcher expects to download the Daemon archive from a URL. Locally, this is served with `http-server` on port 8081:

```sh
bun run daemon:build:serve
```

This runs `npx http-server ./dist -p 8081` inside `apps/daemon/`, making the archive available at:
- `http://localhost:8081/dcs-dropzone.tar`
- `http://localhost:8081/dcs-dropzone.tar.manifest`

**Keep this terminal running** — the Launcher will fetch from it.

### 3. Build the Launcher

In a new terminal, compile the Launcher into a standalone executable:

```sh
bun run launcher:build
```

This runs `apps/launcher/_build.ts` which compiles `apps/launcher/src/index.ts` into `apps/launcher/dist/Dropzone_Launcher.exe`. The build loads `apps/launcher/.env.prod` which points `DZ_LAUNCHER_RELEASE_TAR_PATH` at the GitHub releases URL. For local development, run `bun run launcher:build:local` instead to load `.env.local`, which points at the local `http-server` from step 2 (`http://localhost:8081/`).

### 4. Build the Setup Installer

Package the Launcher into a Windows installer using Inno Setup:

```sh
bun run installer:build
```

This runs `iscc apps/launcher/installer.iss` and outputs `apps/launcher/dist/Dropzone_Setup.exe`.

### 5. Run the Setup

Run `apps/launcher/dist/Dropzone_Setup.exe`. The installer will:
- Let you choose an install directory (default: `%LOCALAPPDATA%\DCSDropzone`)
- Copy `Dropzone_Launcher.exe` into the install directory
- Create Start Menu and (optionally) desktop shortcuts with the working directory set to the install path

### 6. Launch

Run DCS Dropzone from the Start Menu or desktop shortcut. The Launcher will:
1. Fetch the manifest from `http://localhost:8081/dcs-dropzone.tar.manifest`
2. Download `dcs-dropzone.tar` if the version has changed (or it is the first run)
3. Unpack the Daemon into a versioned subfolder inside the install directory
4. Start `Dropzone.exe` (the Daemon)

The Daemon serves its API at `http://localhost:56499` and opens a webview.

## Webapp (optional)

The webapp is **not required** for the Daemon or Launcher to work. It provides the web-based mod browsing UI. If you want to test with it running:

### Recommended: Docker Compose

From the webapp directory, spin up the webapp and its MongoDB dependency:

```sh
cd apps/webapp
docker compose up --build
```

Or from the root using the `start` script:

```sh
bun run --filter webapp start
```

This builds the webapp in a Docker container and starts it alongside MongoDB. The webapp will be available at `http://localhost:3000`.

### Alternative: Development mode

If you want hot-reload for webapp development:

```sh
bun run webapp:dev
```

This starts MongoDB via Docker Compose and runs the webapp with `bun --hot`. You need Docker running for the MongoDB container.

## Environment files for local overrides

Each app has two checked-in `.env` files that provide configuration defaults for different environments. Bun's `--env-file` flag loads these files before the process starts:

| App          | Local                          | Production                         | Key overrides                                                |
|--------------|--------------------------------|------------------------------------|--------------------------------------------------------------|
| **Daemon**   | `apps/daemon/.env.local`       | `apps/daemon/.env.prod`            | Host, port, webview debug, schema generation, database path  |
| **Webapp**   | `apps/webapp/.env.local`       | `apps/webapp/.env.prod`            | Port, MongoDB URI, cookie secret, dev serving, UI debug      |
| **Launcher** | `apps/launcher/.env.local`     | `apps/launcher/.env.prod`          | Points tar URLs at `localhost:8081` (local) or GitHub (prod)  |

Scripts in each app's `package.json` select the appropriate env file:

- `bun run dev` loads `.env.local` for development.
- `bun run build` loads `.env.prod` for production builds.
- `bun run build:local` loads `.env.local` for local builds.
- `bun test` (at root) loads all `.env.local` files at once.

See the [ARC-002 ADR](../.archgate/adrs/ARC-002-layered-app-configuration.md) for full details on how configuration layering works.

## Quick reference

| Command                    | What it does                                              |
|----------------------------|-----------------------------------------------------------|
| `bun run daemon:build`     | Build the Daemon binary + release archive                 |
| `bun run daemon:build:serve` | Serve the Daemon archive on `http://localhost:8081`     |
| `bun run daemon:dev`       | Run the Daemon in watch mode (no compile, direct from source) |
| `bun run launcher:build`   | Build the Launcher executable                             |
| `bun run installer:build`  | Build the Windows installer with Inno Setup               |
| `bun run launcher:dev`     | Run the Launcher in watch mode                            |
| `bun run webapp:build`     | Build the Webapp binary                                   |
| `bun run webapp:dev`       | Run the Webapp with hot-reload (needs Docker for MongoDB) |
| `bun run --filter webapp start` | Run the Webapp + MongoDB in Docker Compose           |
| `bun run build`            | Build everything (webapp, daemon, launcher, installer)    |
| `bun test`                 | Run all tests                                             |
