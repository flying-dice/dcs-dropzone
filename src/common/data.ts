export enum ModCategory {
	Campaign = "Campaign",
	DeviceProfiles = "Device Profiles",
	Mod = "Mod",
	Mission = "Mission",
	Skin = "Skin",
	Sound = "Sound",
	Terrain = "Terrain",
	Utility = "Utility",
	Other = "Other",
}

export enum ModVisibility {
	Public = "Public",
	Private = "Private",
	Unlisted = "Unlisted",
}

export enum SymbolicLinkDestRoot {
	DCS_WORKING_DIR = "DCS_WORKING_DIR",
	DCS_INSTALL_DIR = "DCS_INSTALL_DIR",
}

export const data = {
	categories: Object.values(ModCategory),
	visibilities: Object.values(ModVisibility),
	symbolicLinkDestRoots: Object.values(SymbolicLinkDestRoot),
};
