# DCS Dropzone

A modern mod manager for DCS World that makes it easy to discover, download, and manage your favorite mods.

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
- DCS World installation

### Setup

1. Clone the repository:
```bash
git clone https://github.com/flying-dice/dcs-dropzone.git
cd dcs-dropzone
```

2. Install dependencies:
```bash
bun install
```

3. Run the development servers:
```bash
# Web application
bun run dev

# Daemon service (in another terminal)
bun run dev:daemon
```

### Building

```bash
# Build web application
bun run build

# Build daemon
bun run build:daemon
```

### Testing

```bash
bun test
```

See the [docs/](./docs) folder for detailed technical documentation.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private. All rights reserved.

## 🙏 Acknowledgments

- DCS World by Eagle Dynamics
- The DCS modding community
