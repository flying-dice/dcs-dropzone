[![Join Discord](https://img.shields.io/badge/Join-blue?logo=discord&label=Discord)](https://discord.gg/bT7BEHn5RD)
[![Discord](https://img.shields.io/discord/738118932937834566?logo=discord&label=Discord)](https://discord.com/channels/738118932937834566/1178991295260278785)

![index](./index.png)

**Dropzone: The Community Mod Manager for DCS World**

Dropzone simplifies publishing, discovery, and managing of mods for DCS World.

Mod installation is managed by DROPZONE, it will download, unpack, and symlink mods into your DCS World directories. This allows you to easily enable and disable mods without having to manually manage files.

## What is DCS-Dropzone?

Dropzone provides a complete solution for DCS World players and server admins find, publish, install, enable/disable, and update mods. It pairs:
- A Web Application where mod authors publish releases and users browse and manage selections.
- A Daemon that runs on players’ or servers’ machines to download mod releases and activate them via symbolic links—without duplicating large files.

It also supports mission scripting hooks that run on mission start, both before and after the DCS sanitize step, enabling authors to write mods that apply across missions.

## Monorepo at a glance

```text
dcs-dropzone/
├─ apps/
│  ├─ webapp/   # Server-side Web Application: publish, browse, download, enable/disable mods
│  └─ daemon/   # Client-side Daemon with TUI + API: installs releases, creates/removes symlinks
└─ ...
```

Each app maintains its own configuration, dependencies, and operational README (see the respective directories for setup and commands).

## Key capabilities

- Mod publishing and release management
- Browsing, downloading, enabling, and disabling mods via the Web Application
- Local installation via the Daemon with symbolic links to avoid redundant copies
- Mission scripting support on mission start:
  - Before Sanitize
  - After Sanitize
- Terminal UI for local control and visibility
- API between Web Application and Daemon to orchestrate actions

## How it works (high level)

1. Authors publish a mod release in the Web Application (metadata + assets).
2. Users select mods to install or enable in the Web Application.
3. The Daemon, running on the user’s machine, receives instructions via its API.
4. For a selected release, the Daemon downloads the necessary files.
5. Enabling a mod creates symbolic links for the specified files/folders into the appropriate DCS locations; disabling removes those links.
6. On mission start, optional mission scripting files can run before and after sanitize, enabling cross-mission customization.

Notes:
- Symbolic linking minimizes duplicated data and speeds up toggling mods.
- The Daemon’s TUI provides local status and controls; advanced flows can be automated via its API.

## Mission scripting support

DCS-Dropzone can ship mission scripting files with mods that:
- Execute on mission start
- Run either before sanitize or after sanitize
- Allow authors to target global mission behavior safely and predictably

Consult individual mod documentation for exact scripting entry points and expectations.

## Who is this for?

- Players who want a streamlined way to manage mod collections
- Server administrators standardizing mod sets across hosts
- Mod authors distributing releases to a broader audience with minimal friction

## Getting started

> TBC

## Security and safety

- Symbolic links grant the Daemon access to targeted file locations; run the Daemon only on machines you control and trust.
- Review mod sources and scripts before enabling, especially those with mission scripting hooks.

## Contributing

- Issues and feature requests: please open an issue describing the problem or proposal.
- Pull requests: keep changes scoped; add tests or verification steps when applicable.
- See `apps/webapp` and `apps/daemon` for project-specific conventions and tooling.

## License

- See LICENSE in the repository root (or the applicable license files in subprojects).

## Support and contact

- For bugs, questions, or ideas, open an issue. Mod authors can provide per-mod documentation within their releases and repositories.
