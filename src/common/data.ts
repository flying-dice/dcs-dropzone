export enum ModCategory {
	CAMPAIGN = "CAMPAIGN",
	DEVICE_PROFILES = "DEVICE_PROFILES",
	MOD = "MOD",
	MISSION = "MISSION",
	SKIN = "SKIN",
	SOUND = "SOUND",
	TERRAIN = "TERRAIN",
	UTILITY = "UTILITY",
	OTHER = "OTHER",
}

export const ModCategories: ModCategory[] = Object.values(ModCategory);

export enum ModVisibility {
	PUBLIC = "PUBLIC",
	PRIVATE = "PRIVATE",
	UNLISTED = "UNLISTED",
}

export enum SymbolicLinkDestRoot {
	DCS_WORKING_DIR = "DCS_WORKING_DIR",
	DCS_INSTALL_DIR = "DCS_INSTALL_DIR",
}

export enum MissionScriptRunOn {
	MISSION_START_BEFORE_SANITIZE = "MISSION_START_BEFORE_SANITIZE",
	MISSION_START_AFTER_SANITIZE = "MISSION_START_AFTER_SANITIZE",
}

export enum AssetStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
	ERROR = "ERROR",
}

export enum DownloadJobStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
	ERROR = "ERROR",
}

export enum ExtractJobStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
	ERROR = "ERROR",
}

export enum SubscribedReleaseStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	DISABLED = "DISABLED",
	ENABLED = "ENABLED",
	ERROR = "ERROR",
}

export const data = {
	categories: Object.values(ModCategory),
	visibilities: Object.values(ModVisibility),
	symbolicLinkDestRoots: Object.values(SymbolicLinkDestRoot),
	missionScriptRunOnOptions: Object.values(MissionScriptRunOn),
};
