import assetHelpEnMd from "./en_AssetHelp.md" with { type: "text" };
import symbolicLinkHelpEnMd from "./en_SymbolicLinkHelp.md" with {
	type: "text",
};

export default {
	translation: {
		EMPTY_RELEASES_TITLE: "No Releases Added",
		EMPTY_RELEASES_SUBTITLE:
			"Add download URLs for your mod files. These will be downloaded and extracted by the desktop manager.",

		EMPTY_ASSET_URLS_TITLE: "No Asset URLs Added",
		EMPTY_ASSET_URLS_DESCRIPTION:
			"Add download URLs for your mod files. These will be downloaded and extracted by the desktop client.",

		ASSET_HELP_MD: assetHelpEnMd,
		SYMBOLIC_LINK_HELP_MD: symbolicLinkHelpEnMd,

		SEARCH_MODS_PLACEHOLDER: "Search mods...",
		LIGHT: "Light",
		DARK: "Dark",
		AUTO: "Auto",

		DASHBOARD: "Dashboard",
		BROWSE_MODS: "Browse Mods",
		SUBSCRIBED: "Subscribed",
		ENABLED: "Enabled",
		UPDATES: "Updates",
		MY_MODS: "My Mods",
		USER_MODS: "User Mods",

		CATEGORIES: "CATEGORIES",
		AIRCRAFT: "Aircraft",
		MAPS: "Maps",
		WEAPONS: "Weapons",

		TOTAL_MODS: "Total Mods",
		FEATURED_MODS: "Featured Mods",
		POPULAR_MODS: "Popular mods",
		VIEW_ALL_MODS: "View all mods",
		DISPLAYING_RANGE: "Displaying {{start}} to {{end}} of {{total}} Mods",

		SUBSCRIBE: "Subscribe",
		UNSUBSCRIBE: "Unsubscribe",

		PUBLISH_NEW_MOD: "Publish New Mod",
		CREATE_NEW_MOD: "Create New Mod",
		PUBLISHED_MODS: "Published Mods",
		TOTAL_DOWNLOADS: "Total Downloads",
		AVERAGE_RATING: "Average Rating",

		CREATE_NEW_RELEASE: "Create New Release",

		LOADING: "Loading...",
		ERROR_LOADING_MOD: "Error loading mod.",
		ERROR_LOADING_RELEASE: "Error loading release.",
		ERROR_STATUS: "Error: {{status}}",

		LOGIN: "Login",
		VIEW_USER_DETAILS: "View User Details",
		VIEW_PROFILE: "View Profile",
		LOGOUT: "Logout",
		USER_ID: "User ID",
		USER_ID_DESCRIPTION:
			"This is your ID, all mods you publish will be bound to this ID",
		USER_LOGIN: "User Login",
		USER_LOGIN_DESCRIPTION: "This is your Username",
		USER_NAME: "User Name",
		USER_NAME_DESCRIPTION: "This is your Name",
		USER_PROFILE_URL: "User Profile URL",
		USER_PROFILE_URL_DESCRIPTION: "This is your Profile URL",

		// Additional keys
		EMPTY_RELEASES_DESCRIPTION:
			"Add download URLs for your mod files. These will be downloaded and extracted by the desktop manager.",
		ADD_DEPENDENCY: "Add dependency",
		BASIC_INFORMATION: "Basic information",
		MOD_NAME: "Mod name",
		CATEGORY: "Category",
		DESCRIPTION: "Description",

		ASSET_URLS_LABEL: "Asset URLs",
		ASSET_URLS_DESCRIPTION:
			"For assets with multi-part files add multiple URLs.",

		ASSET_NAME_LABEL: "Asset Name",
		ASSET_NAME_DESCRIPTION:
			"Name of the asset, this will be shown during download.",

		ADD_URL: "Add URL",

		ASSET_IS_ARCHIVE_LABEL: "Is Archive",
		ASSET_IS_ARCHIVE_DESCRIPTION:
			"Check if the asset is an archive file that needs to be extracted.",

		SAVE: "Save",
		REMOVE: "Remove",

		PUBLIC: "Public",
		PRIVATE: "Private",
		UNLISTED: "Unlisted",

		// Symbolic Links
		SYMBOLIC_LINKS_TITLE: "Symbolic Links",
		ADD_SYMBOLIC_LINK: "Add Symbolic Link",
		EDIT_SYMBOLIC_LINK: "Edit Symbolic Link",
		NO_SYMBOLIC_LINKS_TITLE: "No symbolic links configured",
		NO_SYMBOLIC_LINKS_DESCRIPTION:
			"Add symbolic links to be created when users enable your mod. Links are created from the mod directory to the DCS directories.",

		SYMBOLIC_LINK_NAME_LABEL: "Link Name",
		SYMBOLIC_LINK_NAME_DESCRIPTION:
			"Name of the symbolic link for identification",
		SYMBOLIC_LINK_NAME_PLACEHOLDER: "e.g., My Mod Link",
		SYMBOLIC_LINK_SRC_LABEL: "Source Path",
		SYMBOLIC_LINK_SRC_DESCRIPTION:
			"Path relative to the mod download directory",
		SYMBOLIC_LINK_SRC_PLACEHOLDER: "e.g., Mods/MyMod or Scripts/MyScript.lua",
		SYMBOLIC_LINK_DEST_ROOT_LABEL: "Destination Root",
		SYMBOLIC_LINK_DEST_ROOT_DESCRIPTION:
			"Select the DCS directory root where the link will be created",
		SYMBOLIC_LINK_DEST_LABEL: "Destination Path",
		SYMBOLIC_LINK_DEST_DESCRIPTION:
			"Path relative to the selected destination root",
		SYMBOLIC_LINK_DEST_PLACEHOLDER: "e.g., Mods/MyMod or Scripts/MyScript.lua",
		SYMBOLIC_LINK_DEST_ROOT_WORKING_DIR: "DCS Working Directory",
		SYMBOLIC_LINK_DEST_ROOT_INSTALL_DIR: "DCS Install Directory",
		SYMBOLIC_LINK_SOURCE_LABEL: "Source",
		SYMBOLIC_LINK_DESTINATION_LABEL: "Destination",

		// Mission Scripts
		MISSION_SCRIPTS_TITLE: "Mission Scripts",
		ADD_MISSION_SCRIPT: "Add Mission Script",
		EDIT_MISSION_SCRIPT: "Edit Mission Script",
		NO_MISSION_SCRIPTS_TITLE: "No mission scripts configured",
		NO_MISSION_SCRIPTS_DESCRIPTION:
			"Add mission scripts to be run when missions start. Scripts can run before or after sanitization.",

		MISSION_SCRIPT_NAME_LABEL: "Script Name",
		MISSION_SCRIPT_NAME_DESCRIPTION:
			"Name of the mission script for identification",
		MISSION_SCRIPT_NAME_PLACEHOLDER: "e.g., Mission Initializer",

		MISSION_SCRIPT_PURPOSE_LABEL: "Purpose",
		MISSION_SCRIPT_PURPOSE_DESCRIPTION:
			"Brief description of what the script does",
		MISSION_SCRIPT_PURPOSE_PLACEHOLDER:
			"e.g., Sets up initial mission conditions",

		MISSION_SCRIPT_PATH_LABEL: "Script Path",
		MISSION_SCRIPT_PATH_DESCRIPTION:
			"Path to the script file relative to the selected root directory",
		MISSION_SCRIPT_PATH_PLACEHOLDER: "e.g., Scripts/Hooks/MyScript.lua",
		MISSION_SCRIPT_PATH_DISPLAY: "Path",
		MISSION_SCRIPT_ROOT_LABEL: "Root Directory",
		MISSION_SCRIPT_ROOT_DESCRIPTION:
			"Select the DCS directory root where the script is located",
		MISSION_SCRIPT_ROOT_WORKING_DIR: "DCS Working Directory",
		MISSION_SCRIPT_ROOT_INSTALL_DIR: "DCS Install Directory",
		MISSION_SCRIPT_RUN_ON_LABEL: "Run On",
		MISSION_SCRIPT_RUN_ON_DESCRIPTION:
			"Select when the script should be executed during mission start",
		MISSION_SCRIPT_RUN_ON_BEFORE_SANITIZE: "Mission Start (Before Sanitize)",
		MISSION_SCRIPT_RUN_ON_AFTER_SANITIZE: "Mission Start (After Sanitize)",
		MISSION_SCRIPT_HELP_MD: `# Mission Scripts

Mission scripts allow you to specify Lua scripts that should be executed when a mission starts in DCS.

## Root Directory
- **DCS Working Directory**: User-specific DCS directory (typically in Saved Games)
- **DCS Install Directory**: Main DCS installation directory

## Run Timing
- **Before Sanitize**: Script runs before DCS sanitizes the mission environment
- **After Sanitize**: Script runs after DCS sanitizes the mission environment

Scripts are specified as paths relative to the selected root directory.`,
	},
};
