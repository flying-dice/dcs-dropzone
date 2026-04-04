# How the Webapp works

This guide explains the role of the Webapp in DCS Dropzone, how [mods](#) and [releases](#) are structured in the [registry](#), and how the Webapp connects to the [Daemon](#) on the user's machine. Familiarity with the basic concept of a mod manager is assumed.

## The registry

The Webapp hosts the mod registry — the authoritative list of community mods available for DCS World. When a user opens DCS Dropzone on their machine, the Daemon queries the registry to discover what mods are available, fetch release metadata, and check for updates.

The registry is a hosted service. Users do not run it locally. The Daemon communicates with it over the network, and the Webapp's browser UI presents the same data to users browsing for mods.

## Mods

A mod is the top-level entry in the registry. It represents a community-created addition to DCS World and carries all the information needed to display it to users: name, description, thumbnail, screenshots, category, tags, and the list of maintainers who manage it.

### Categories

Every mod belongs to exactly one category. Categories are used for browsing and filtering in the UI.

| Category | Description |
|---|---|
| `CAMPAIGN` | A scripted mission campaign |
| `DEVICE_PROFILES` | Controller and input device profiles |
| `MOD` | General aircraft, weapon, or gameplay modification |
| `MISSION` | A standalone mission file |
| `SKIN` | Aircraft or vehicle livery |
| `SOUND` | Audio replacement or addition |
| `TERRAIN` | Map or theatre modification |
| `UTILITY` | Tools, scripts, and supporting content |
| `OTHER` | Content that does not fit another category |

### Tags

Mods can carry multiple free-form tags in addition to their category. Tags allow maintainers to describe content in more detail and allow users to filter by specific aircraft, theatres, or themes.

### Visibility

A mod's visibility controls who can see it in the registry.

| Visibility | Behaviour |
|---|---|
| `PUBLIC` | Visible to all users in search and browse results |
| `PRIVATE` | Visible only to the mod's maintainers |
| `UNLISTED` | Not shown in browse or search, but accessible via direct link |

New mods start as `PRIVATE`. A maintainer must explicitly publish a mod to make it `PUBLIC`.

### Maintainers

Every mod has one or more maintainers — the users responsible for managing its content and releases. Only maintainers can edit a mod's details, create releases, and change visibility. A mod must always have at least one maintainer.

Authentication is handled via GitHub. Users sign in with their GitHub account, which becomes their identity in the registry.

## Releases

A release is a versioned snapshot of a mod. Mods accumulate releases over time as maintainers publish updates. Each release is independent — installing a new release does not automatically replace an older one on the user's machine.

A release carries three types of content that the Daemon uses to install and activate it: assets, symbolic links, and mission scripts.

### Assets

Assets are the downloadable files for a release. Each asset has a name and one or more download URLs. When the Daemon installs a release, it downloads each asset and unpacks it into the local mod store.

An asset marked as an archive is automatically extracted after download. Assets not marked as archives are placed as-is.

### Symbolic links

Symbolic links tell the Daemon where to place the mod's files so DCS World can find them. Each symbolic link definition specifies a source path (within the unpacked asset) and a destination path in one of two root locations: the DCS World installation directory or the DCS World [saved games directory](#).

The Daemon reads these definitions when the user enables a mod and creates the corresponding symlinks on disk. Disabling the mod removes them.

### Mission scripts

Mission scripts are Lua scripts bundled with a release that extend or modify DCS World mission behaviour. Each script definition specifies the script's path within the release, where it should be placed, and when it should run — on mission start, on player join, or both.

### Release visibility

Like mods, individual releases have a visibility setting. A release can be `PUBLIC` while the mod itself is still `PRIVATE`, or vice versa. Only releases that are both public and part of a public mod appear in the registry to other users.

## How the Daemon uses the Webapp

The Daemon does not manage its own list of available mods. It delegates discovery entirely to the Webapp's API. The typical flow is:

1. The user browses the registry in the Webapp and requests installation of a mod.
2. The Webapp passes the release identifier to the Daemon.
3. The Daemon fetches the full release data — assets, symbolic link definitions, and mission scripts — from the Webapp API.
4. The Daemon downloads the assets and uses the symbolic link definitions to activate the mod.

The Daemon also calls the Webapp periodically to check whether any installed mods have newer releases available, using the version hash stored against each release.

## See Also

- [How the Daemon works](/guides/how-the-daemon-works) — How the Daemon downloads, unpacks, and activates releases.
- [Add Release](/daemon/spec/add-release) — Spec page for the Daemon behavior triggered when a user installs a mod.
- [Enable Release](/daemon/spec/enable-release) — Spec page for the Daemon behavior that activates a mod using symlink definitions.
