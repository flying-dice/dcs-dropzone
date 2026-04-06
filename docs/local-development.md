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
cd apps/daemon && bun run build
```

This runs `apps/daemon/scripts/build.ts` which:
- Compiles `apps/daemon/src/index.ts` into `apps/daemon/dist/Dropzone.exe`
- Bundles helper binaries (wget, 7za) into `dist/`
- Packages everything into `apps/daemon/dist/dcs-dropzone.tar` with a `.manifest` file

### 2. Serve the Daemon build locally

The Launcher expects to download the Daemon archive from a URL. Locally, this is served with `http-server` on port 8081:

```sh
cd apps/daemon && bun run build:serve
```

This runs `npx http-server ./dist -p 8081` inside `apps/daemon/`, making the archive available at:
- `http://localhost:8081/dcs-dropzone.tar`
- `http://localhost:8081/dcs-dropzone.tar.manifest`

**Keep this terminal running** — the Launcher will fetch from it.

### 3. Build the Launcher

In a new terminal, compile the Launcher into a standalone executable:

```sh
cd apps/launcher && bun run build
```

This compiles `apps/launcher/src/index.ts` into `apps/launcher/dist/Dropzone_Launcher.exe`. By default the build uses the `local` environment config (pointing `DZ_LAUNCHER_RELEASE_TAR_PATH` at `http://localhost:8081/`). To build for production, set `DZ_TARGET_ENV=prod` which switches to the production URLs from `apps/launcher/scripts/_env.ts`.

### 4. Build the Setup Installer

Package the Launcher into a Windows installer using Inno Setup:

```sh
iscc apps/launcher/installer.iss
```

This outputs `apps/launcher/dist/Dropzone_Setup.exe`.

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

## Environment configuration

Configuration is defined as typed TypeScript objects inside each app's `scripts/` directory — there are no `.env` files. Each app exports named environment configs that the build/dev/test scripts import directly:

| App          | Config file                          | Exported configs                                       |
|--------------|--------------------------------------|--------------------------------------------------------|
| **Daemon**   | `apps/daemon/scripts/_env.ts`         | `envLocalDev`, `envLocalTest`, `envLocalBuild`, `envProdBuild` |
| **Webapp**   | `apps/webapp/scripts/_env.ts`        | `envLocalDev`, `envLocalTest`, `envLocalBuild`, `envProdBuild` |
| **Launcher** | `apps/launcher/scripts/_env.ts`      | `envLocalBuild`, `envProdBuild`                        |

The target environment is selected via the `DZ_TARGET_ENV` environment variable (values: `local` | `prod`, default: `local`), handled by `scripts/_target-env.ts` at the repo root:

- `bun run dev` — always uses the `local` dev config.
- `bun run build` — uses `local` config by default; set `DZ_TARGET_ENV=prod` for production.
- `bun run tests` — always uses the `local` test config.

To override individual values at runtime, set them as actual environment variables before running the script — the scripts merge `process.env` on top of the config object, so any variable already present in the environment takes precedence.

## Quick reference

| Command                                   | What it does                                              |
|-------------------------------------------|-----------------------------------------------------------|
| `cd apps/daemon && bun run build`         | Build the Daemon binary + release archive                 |
| `cd apps/daemon && bun run build:serve`   | Serve the Daemon archive on `http://localhost:8081`       |
| `bun run daemon:dev`                      | Run the Daemon in watch mode (no compile, direct from source) |
| `cd apps/launcher && bun run build`       | Build the Launcher executable (local config by default)   |
| `DZ_TARGET_ENV=prod cd apps/launcher && bun run build` | Build the Launcher with production URLs    |
| `iscc apps/launcher/installer.iss`        | Build the Windows installer with Inno Setup               |
| `bun run launcher:dev`                    | Run the Launcher in watch mode                            |
| `cd apps/webapp && bun run build`         | Build the Webapp binary                                   |
| `bun run webapp:dev`                      | Run the Webapp with hot-reload (needs Docker for MongoDB) |
| `bun run --filter webapp start`           | Run the Webapp + MongoDB in Docker Compose                |
| `bun run build`                           | Build everything (webapp, daemon, launcher)               |
| `bun run tests`                           | Run all tests                                             |
