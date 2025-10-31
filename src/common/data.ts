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

export const ModVisibility = {
	Public: "Public",
	Private: "Private",
	Unlisted: "Unlisted",
};

export const data = {
	categories: Object.values(ModCategory),
	visibilities: Object.values(ModVisibility),
};
