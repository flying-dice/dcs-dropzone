# Symbolic Links

Configure symbolic links to be created when users enable your mod. These links allow your mod files to be accessed from the appropriate DCS directories.

## Source Path

The path relative to your mod's download directory. This is the location of the files within your mod's folder.

**Example:** `Mods/MyMod` or `Scripts/MyScript.lua`

## Destination Root

Choose the DCS directory where the symbolic link will be created:

- **DCS Working Directory**: User data folder (typically `%USERPROFILE%\Saved Games\DCS` or `%USERPROFILE%\Saved Games\DCS.openbeta`)
- **DCS Install Directory**: Installation folder where DCS World is installed

## Destination Path

The path relative to the selected destination root where the symbolic link will be created.

**Example:** `Mods/MyMod` or `Scripts/MyScript.lua`

## How It Works

When a user enables your mod:
1. Files are downloaded to the mod directory
2. Symbolic links are created from the source to the destination
3. DCS can now access your mod files from the appropriate location

When a user disables your mod:
- The symbolic links are removed
- Your mod files remain in the download directory
