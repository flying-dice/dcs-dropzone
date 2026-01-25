# Mission Scripts

Mission scripts allow you to specify Lua scripts that should be executed when a mission starts in DCS.

## Root Directory
- **DCS Working Directory**: User-specific DCS directory (typically in Saved Games)
- **DCS Install Directory**: Main DCS installation directory

## Run Timing
- **Before Sanitize**: Script runs before DCS sanitizes the mission environment
- **After Sanitize**: Script runs after DCS sanitizes the mission environment

Scripts are specified as paths relative to the selected root directory.