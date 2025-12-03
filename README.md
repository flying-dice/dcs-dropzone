# DCS Dropzone

A modern mod manager and registry for DCS World, providing a centralized platform to discover, download, and manage DCS World mods with automatic installation and update capabilities.

## 🚀 Overview

DCS Dropzone consists of two main components:

1. **Web Application (Registry)** - A React-based web interface for browsing, discovering, and managing mods
2. **Daemon Service** - A local background service that handles downloads, extractions, and installations

The system uses a robust queue-based architecture with automatic retry, crash recovery, and resumable operations to ensure reliable mod management.

## ✨ Features

- 📦 **Mod Discovery & Management** - Browse and search through a curated registry of DCS World mods
- ⬇️ **Automated Downloads** - Queue-based download system with automatic retry and resume capabilities
- 📂 **Smart Extraction** - Automatic archive extraction with dependency tracking
- 🔄 **Update Management** - Track and install mod updates
- 🔗 **GitHub Integration** - Direct integration with GitHub releases for mod distribution
- 💾 **Persistent Queues** - Database-backed operations that survive crashes and restarts
- 🎯 **Symbolic Link Management** - Automatic installation to DCS directories
- 🌍 **Internationalization** - Multi-language support
- 🎨 **Modern UI** - Built with Mantine and React 19

## 🏗️ Architecture

### Web Application
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Mantine Components
- **State Management**: TanStack Query
- **Routing**: React Router v7
- **Build Tool**: Bun

### Daemon Service
- **Runtime**: Bun
- **API Framework**: Hono
- **Database**: SQLite (via Drizzle ORM)
- **Queue System**: Custom persistent queues with MongoDB
- **External Tools**: wget (downloads), 7zip (extraction)

### Key Systems

#### Download Queue
- Database-backed persistent queue
- Automatic retry with configurable delays
- Resumable downloads using wget
- Progress tracking and event emission
- Single-job concurrency to manage resources

See [Download Queue Documentation](./docs/download-queue-system.md) for details.

#### Extract Queue
- Coordinated with download queue
- Dependency tracking for multi-part archives
- 7zip-based extraction
- Automatic retry on failure
- Progress monitoring

See [Extract Queue Documentation](./docs/extract-queue-system.md) for details.

#### Command-Query Pattern
The server uses a command-query separation pattern for clean, testable business logic.

See [Command-Query Pattern Documentation](./docs/command-query-pattern.md) for details.

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- DCS World installation
- Windows (primary support) or macOS/Linux (community support)

### Required Binaries
- `wget` - For downloading files
- `7zip` (7za/7zz) - For archive extraction

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/flying-dice/dcs-dropzone.git
cd dcs-dropzone
```

2. Install dependencies:
```bash
bun install
```

3. Configure the application by editing `config.toml`:
```toml
[dcs]
dcs_working_dir = "C:/Users/YourUser/Saved Games/DCS.openbeta"
dcs_install_dir = "D:/Program Files/Eagle Dynamics/DCS World OpenBeta"

[binaries]
wget = "binaries/wget.exe"
sevenzip = "binaries/7za.exe"

[server]
host = "0.0.0.0"
port = 3001

[database]
url = "index.sqlite"
```

4. Initialize the database:
```bash
bun run drizzle
```

## 🚀 Usage

### Development Mode

Run the web application:
```bash
bun run dev
```

Run the daemon service:
```bash
bun run dev:daemon
```

The web application will be available at `http://localhost:3000` and the daemon API at `http://localhost:3001`.

### Production Build

Build the application:
```bash
bun run build
```

Build the daemon:
```bash
bun run build:daemon
```

### Using Docker

Start both services with Docker Compose:
```bash
bun run start
# or
docker compose up
```

## 🧪 Testing

Run the test suite:
```bash
bun test
```

## 📝 Configuration

### DCS Directories
Configure your DCS World installation and working directories in `config.toml`:
- `dcs_install_dir` - Where DCS World is installed
- `dcs_working_dir` - Your DCS World saved games directory (user data)

### Binary Paths
Specify paths to required external tools:
- `wget` - Download utility
- `sevenzip` - Archive extraction utility

### Server Settings
- `host` - IP address to bind the HTTP server (default: 0.0.0.0)
- `port` - Port for the daemon API (default: 3001)

### Database
- `url` - Path to the SQLite database file

## 🔧 Development

### Project Structure
```
dcs-dropzone/
├── src/
│   ├── app/           # Web application
│   │   ├── client/    # React frontend
│   │   └── server/    # Backend API
│   ├── daemon/        # Background service
│   │   ├── api/       # Daemon API endpoints
│   │   ├── commands/  # Command pattern implementations
│   │   ├── queries/   # Query pattern implementations
│   │   ├── queues/    # Download & extract queues
│   │   └── services/  # Business logic services
│   └── common/        # Shared code
├── docs/              # Documentation
├── binaries/          # External tools (wget, 7zip)
├── tests/             # Test files
└── config.toml        # Configuration file
```

### Code Quality

Check code style and types:
```bash
bun run check
```

This runs both Biome (linter/formatter) and TypeScript compiler checks.

Format code:
```bash
bun run biome
```

Type check:
```bash
bun run tsc
```

### Database Migrations

Generate a new migration:
```bash
bun run drizzle
```

This will create migration files and run the post-migration setup script.

## 📚 Documentation

- [Command-Query Pattern](./docs/command-query-pattern.md) - Server architecture pattern
- [Download Queue System](./docs/download-queue-system.md) - Download management
- [Extract Queue System](./docs/extract-queue-system.md) - Archive extraction

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow the existing code style (enforced by Biome)
- Write tests for new features
- Update documentation as needed
- Use the command-query pattern for new operations
- Keep commits focused and descriptive

## 📄 License

This project is private. All rights reserved.

## 🙏 Acknowledgments

- DCS World by Eagle Dynamics
- The DCS modding community
- All contributors to the open-source libraries used in this project

## 🐛 Troubleshooting

### Downloads not starting
1. Verify `wget` executable path in `config.toml`
2. Check the database for jobs stuck in `IN_PROGRESS`
3. Verify the job hasn't exceeded `maxAttempts`

### Extractions failing
1. Verify `7zip` executable path in `config.toml`
2. Check all dependent downloads are completed
3. Verify archive files exist and are not corrupted

### Application won't start
1. Ensure all dependencies are installed: `bun install`
2. Check that the configured ports are not in use
3. Verify DCS directories in `config.toml` exist
4. Check logs in the console for specific error messages

## 📞 Support

For issues, questions, or contributions, please use the GitHub issue tracker.
