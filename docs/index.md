# DCS Dropzone

DCS Dropzone is a mod manager for DCS World that handles discovering, installing, and activating community mods through a suite of three applications: the [Daemon](#daemon), the [Webapp](#webapp), and the [Launcher](#launcher).

## Applications

### Daemon

The Daemon is a local background process that manages the full mod lifecycle on the user's machine. It downloads [releases](#), unpacks them into a local mod store, and enables or disables [mods](#) by managing [symlinks](#) in the DCS World [saved games directory](#).

- [Daemon documentation](/daemon/)

### Webapp

The Webapp is a hosted web application where users browse and discover mods from the [registry](#). It provides search, filtering, and mod detail pages, and communicates installation requests to the local Daemon.

- [Webapp documentation](/webapp/)

### Launcher

The Launcher is a desktop process that runs on startup. It checks for available application updates, downloads and applies them, then starts the Daemon. Users interact with the Launcher to keep DCS Dropzone itself up to date.

- [Launcher documentation](/launcher/)

## Guides

[Mod lifecycle overview](/guides/mod-lifecycle)
:   End-to-end walkthrough of the journey from discovering a mod in the Webapp to having it active in DCS World, covering each application's role in the process.

[Getting started with local development](/local-development)
:   How to run all three applications locally for development and testing.

## Spec

Spec pages define system behaviors for [Spec Driven Development](/guides/spec-driven-development). Each spec describes one behavior in terms of inputs and observable system actions, with no implementation detail.

- [Daemon specs](/daemon/spec/)
- [Webapp specs](/webapp/spec/)
- [Launcher specs](/launcher/spec/)

## See Also

- [GitHub repository](https://github.com/flying-dice/dcs-dropzone) — Source code, issues, and pull requests.
- [DCS World](https://www.digitalcombatsimulator.com) — The flight simulator DCS Dropzone extends.
