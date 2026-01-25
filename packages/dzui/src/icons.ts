import { ModDataVisibility } from "@packages/clients/webapp";
import { FaHome, FaStar, FaSyncAlt } from "react-icons/fa";
import {
	FaBox,
	FaDownload,
	FaEye,
	FaEyeSlash,
	FaTag,
	FaTerminal,
	FaToggleOn,
	FaTriangleExclamation,
	FaUser,
} from "react-icons/fa6";

export const AppIcons = {
	Home: FaHome,
	Daemon: FaTerminal,
	Featured: FaStar,
	Mods: FaBox,
	Releases: FaTag,
	Downloaded: FaDownload,
	Enabled: FaToggleOn,
	Updates: FaSyncAlt,
	UserMods: FaUser,
	Author: FaUser,
	Public: FaEye,
	Private: FaUser,
	Unlisted: FaEyeSlash,
	Error: FaTriangleExclamation,
};

export const VisibilityIcons = {
	[ModDataVisibility.PUBLIC]: AppIcons.Public,
	[ModDataVisibility.PRIVATE]: AppIcons.Private,
	[ModDataVisibility.UNLISTED]: AppIcons.Unlisted,
};
