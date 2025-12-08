import { FaHome, FaStar, FaSyncAlt } from "react-icons/fa";
import { FaBox, FaDownload, FaEye, FaEyeSlash, FaTag, FaToggleOn, FaUser } from "react-icons/fa6";
import { ModDataVisibility } from "./_autogen/api.ts";

export const AppIcons = {
	Home: FaHome,
	Featured: FaStar,
	Mods: FaBox,
	Releases: FaTag,
	Downloaded: FaDownload,
	Enabled: FaToggleOn,
	Updates: FaSyncAlt,
	UserMods: FaUser,
	Author: FaUser,
};

export const VisibilityIcons = {
	[ModDataVisibility.PUBLIC]: FaEye,
	[ModDataVisibility.PRIVATE]: FaUser,
	[ModDataVisibility.UNLISTED]: FaEyeSlash,
};
