import type { MantineColor } from "@mantine/core";
import type { IconType } from "react-icons";

export type ModCardProps = {
	imageUrl: string;
	category: string;
	title: string;
	summary: string;
	downloads: number;
	isDownloaded?: boolean;
	actions?: {
		label: string;
		onClick: () => void;
		icon: IconType;
		color: MantineColor;
	}[];
	variant: "list" | "grid";
	onClick?: () => void;
};
