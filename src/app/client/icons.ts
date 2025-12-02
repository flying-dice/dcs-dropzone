import { FaHome, FaStar, FaSyncAlt } from "react-icons/fa";
import {
	FaBox,
	FaDownload,
	FaEye,
	FaEyeSlash,
	FaTag,
	FaToggleOn,
	FaUser,
} from "react-icons/fa6";
import { ModVisibility } from "../../common/data.ts";

export const AppIcons = {
	Home: FaHome,
	Featured: FaStar,
	Mods: FaBox,
	Releases: FaTag,
	Downloaded: FaDownload,
	Enabled: FaToggleOn,
	Updates: FaSyncAlt,
	UserMods: FaUser,
	Ratings: FaStar,
};

export const VisibilityIcons = {
	[ModVisibility.PUBLIC]: FaEye,
	[ModVisibility.PRIVATE]: FaUser,
	[ModVisibility.UNLISTED]: FaEyeSlash,
};
