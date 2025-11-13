import { FaHome, FaStar, FaSyncAlt } from "react-icons/fa";
import {
	FaBox,
	FaDownload,
	FaEye,
	FaEyeSlash,
	FaToggleOn,
	FaUser,
} from "react-icons/fa6";
import { ModVisibility } from "../../common/data.ts";

export const AppIcons = {
	Home: FaHome,
	Mods: FaBox,
	Subscribed: FaDownload,
	Enabled: FaToggleOn,
	Updates: FaSyncAlt,
	UserMods: FaUser,
	Ratings: FaStar,
};

export const VisibilityIcons = {
	[ModVisibility.Public]: FaEye,
	[ModVisibility.Private]: FaUser,
	[ModVisibility.Unlisted]: FaEyeSlash,
};
