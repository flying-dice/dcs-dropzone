# DCS Dropzone

A mod registry and management system for Digital Combat Simulator (DCS), providing a web application and daemon service for managing and distributing DCS mods.

## 🎯 Overview

DCS Dropzone consists of two main components:

- **Web Application**: A React-based frontend with Hono API backend for browsing, managing, and distributing DCS mods
- **Daemon Service**: A lightweight background service with SQLite database for mod synchronization and management

## 🏗️ Architecture

### Web Application (`src/app`)
- **Frontend**: React 19 with Mantine UI, React Router, and TanStack Query
- **Backend**: Hono API with OpenAPI documentation
- **Authentication**: GitHub OAuth with signed cookie sessions
- **Database**: MongoDB via Mongoose (ODM)
- **Port**: 3000 (configurable via `PORT` env var)

### Daemon (`src/daemon`)
- **API**: Hono-based REST API with health checks
- **Database**: SQLite with Drizzle ORM
- **Configuration**: TOML-based configuration file
- **Port**: Configurable via `config.toml`

## Data model, services, and validation

- Schemas under `src/app/server/schemas` define the domain data (Data schemas) used across the server. These are the canonical shapes for API responses and service contracts.
- Services encapsulate all persistence and domain logic and interact with Mongoose entities under `src/app/server/entities` (for example, `Mod`, `ModSummary`, `User`).
- All data that enters and leaves the service layer is validated with Zod:
  - Inputs are parsed/validated before any processing (e.g., route validators via `hono-openapi` feed validated objects to services).
  - Service outputs are parsed into the appropriate Data schema so API routes can return them directly without reshaping.
- Non-trivial service responses should be returned in the shape of the Data schema expected by the API routes. Examples:
  - Listing user mods returns `{ data: ModSummaryData[], meta: UserModsMetaData }`.
  - Fetching/creating a mod returns `ModData`.
- MongoDB access uses Mongoose models defined in `src/app/server/entities`, with connection management in `src/app/server/Database.ts`.

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.3.1 or later
- MongoDB (for web application)
- Git

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/flying-dice/dcs-dropzone.git
cd dcs-dropzone

# Install dependencies
bun install
```

### Configuration

#### Web Application

Create a `.env` file or set environment variables:

```bash
PORT=3000
LOG_LEVEL=info
USER_COOKIE_SECRET=your-strong-secret
USER_COOKIE_NAME=__Secure-USERID
GH_CLIENT_ID=your-github-client-id
GH_CLIENT_SECRET=your-github-client-secret
GH_AUTHORIZATION_CALLBACK_URL=http://localhost:3000/auth/github/callback
GH_HOMEPAGE_URL=http://localhost:3000/
MONGODB_URI=mongodb://localhost:27017
```

#### Daemon

Edit `config.toml`:

```toml
[server]
host = "0.0.0.0"
port = 3001

[logging]
level = "info"
colorize = true

[database]
url = "index.sqlite"
```

### Development

#### Run Web Application

```bash
bun dev
```

This starts the development server with hot reload at http://localhost:3000

#### Run Daemon

```bash
bun dev:daemon
```

The daemon API will be available on the port specified in `config.toml`

### Building

Build both components to native binaries:

```bash
# Build web application (outputs to dist/application)
bun run build

# Build daemon (outputs to dist/appd)
bun run build:daemon
```

### Production Deployment

Run with Docker Compose (includes MongoDB):

```bash
bun start
```

Or run the built binaries directly:

```bash
# Run web application
./dist/application

# Run daemon
./dist/appd
```

## 🧪 Testing

```bash
bun test
```

## 🔧 Development Tools

### Linting and Formatting

```bash
bun run biome
```

Uses [Biome](https://biomejs.dev) for code linting and formatting.

### API Client Generation

Generate TypeScript API clients from OpenAPI specs (requires web application running):

```bash
bun run orval
```

Generated clients are available in `src/app/client/_autogen/`

### Database Migrations (Daemon)

```bash
# Generate migration SQL from schema
bun run drizzle

# Apply migrations (runs automatically after drizzle)
bun run postdrizzle
```

Migrations are stored in `src/daemon/database/ddl/` and bundled into `index-ddl.ts` for runtime use.

## 📁 Project Structure

```
dcs-dropzone/
├── src/
│   ├── app/                           # Web application (API + client)
│   │   ├── client/                    # React frontend
│   │   │   ├── pages/                 # Page components
│   │   │   ├── components/            # Reusable UI components
│   │   │   ├── _autogen/              # Generated API clients (orval)
│   │   │   └── index.tsx              # Frontend entry point
│   │   ├── server/                    # Hono API backend
│   │   │   ├── api/                   # API routes (auth, user-mods, health)
│   │   │   ├── entities/              # Mongoose models (Mod, ModSummary, User)
│   │   │   ├── schemas/               # Zod data schemas (domain + response shapes)
│   │   │   ├── services/              # Services using Mongoose, return Zod data
│   │   │   ├── middleware/            # Auth & logging middleware
│   │   │   ├── Database.ts            # Mongoose connection and ping()
│   │   │   └── Application.ts         # Service wiring and context
│   │   └── index.ts                   # Server entry point (Bun.serve)
│   ├── daemon/                        # Daemon service
│   │   ├── api/                       # Daemon API routes (health, subscriptions)
│   │   ├── child_process/             # External process spawning (wget, 7zip)
│   │   ├── database/                  # SQLite database & migrations
│   │   ├── functions/                 # Utility functions
│   │   ├── middleware/                # Request/response logging
│   │   ├── queues/                    # Download and extract queue services
│   │   ├── repositories/              # Data access layer
│   │   ├── schemas/                   # Zod schemas for daemon
│   │   ├── services/                  # Business logic services
│   │   ├── Application.ts             # Service wiring and context
│   │   ├── ApplicationConfig.ts       # TOML config loader
│   │   ├── Server.ts                  # Hono server setup
│   │   └── index.ts                   # Daemon entry point
│   └── common/                        # Shared utilities
├── docs/                              # Additional documentation
├── tests/                             # Integration/E2E test files
├── config.toml                        # Daemon configuration
├── docker-compose.yml                 # Docker orchestration
├── Dockerfile                         # Container image definition
└── package.json                       # Dependencies and scripts
```

## 🔐 Authentication

The web application uses GitHub OAuth for authentication:

1. Register a GitHub OAuth App at https://github.com/settings/developers
2. Set the authorization callback URL to match `GH_AUTHORIZATION_CALLBACK_URL`
3. Configure `GH_CLIENT_ID` and `GH_CLIENT_SECRET` in your environment

Session management
- On successful OAuth callback, the server persists/updates the user and sets a signed cookie named by `USER_COOKIE_NAME` containing only the user’s id.
- Cookies are signed using `USER_COOKIE_SECRET` and set with `Secure` and `SameSite=strict`.
- The `cookieAuth` middleware reads the signed cookie, loads the user from MongoDB, and exposes it via `c.var.getUser()` to secured routes.

## 📚 API Documentation

Both applications expose OpenAPI documentation:

- **Web App**: http://localhost:3000/v3/api-docs (JSON), http://localhost:3000/api (Scalar UI)
- **Daemon**: http://localhost:3001/v3/api-docs (JSON), http://localhost:3001/api (Scalar UI)

Interactive API documentation is available via Scalar UI at the `/api` endpoint.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting: `bun run biome`
5. Test your changes: `bun test`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Use Biome for linting and formatting
- Follow existing code patterns
- Add tests for new features
- Update documentation as needed

## 📝 Additional Documentation

For detailed technical documentation and agent-specific guidance, see [WARP.md](./WARP.md).

### LLM/Agent Guidance

- LLMs and agents should consult and respect https://mantine.dev/llms.txt when working with Mantine-based UI.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: React 19, Mantine UI, React Router, TanStack Query
- **Backend**: Hono, OpenAPI
- **Databases**: MongoDB (web application), SQLite (daemon)
- **ORM**: Drizzle (daemon)
- **Authentication**: GitHub OAuth with signed cookies
- **Build Tools**: Bun, Biome
- **Deployment**: Docker, Docker Compose

## 📄 License

This project is licensed under the terms specified in the repository.

---

Built with [Bun](https://bun.sh) 🚀
