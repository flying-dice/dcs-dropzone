import { Badge, Group, type MantineColor, Paper, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { FaFileArchive } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import { ModReleaseAssetStatusDataStatus } from "../_autogen/daemon_api.ts";

const colors: Record<ModReleaseAssetStatusDataStatus, MantineColor> = {
	[ModReleaseAssetStatusDataStatus.PENDING]: "gray",
	[ModReleaseAssetStatusDataStatus.IN_PROGRESS]: "blue",
	[ModReleaseAssetStatusDataStatus.COMPLETED]: "green",
	[ModReleaseAssetStatusDataStatus.ERROR]: "red",
};

export type AssetListItemProps = {
	name: string;
	urls: { id: string; url: string }[];
	isArchive: boolean;
	onClick?: () => void;
	progressPercent?: number;
	status?: ModReleaseAssetStatusDataStatus;
};
export function AssetListItem(props: AssetListItemProps) {
	const { t } = useAppTranslation();

	return (
		<Paper
			withBorder
			color="blue"
			variant="light"
			style={props.onClick ? { cursor: "pointer" } : {}}
			onClick={props.onClick}
			p={"md"}
		>
			<Stack>
				<Group gap={"xs"}>
					<ThemeIcon variant={"light"}>{props.isArchive ? <FaFileArchive /> : <FaFile />}</ThemeIcon>
					<Text>{props.name}</Text>
					{props.isArchive && (
						<Badge variant={"light"} style={{ textTransform: "none" }}>
							Archive
						</Badge>
					)}
				</Group>
				<Stack gap={"xs"}>
					<Stack gap={2}>
						<Text size={"xs"} fw={"bold"}>
							{t("ASSET_URLS_LABEL")}:
						</Text>
						{props.urls.map((url) => (
							<Text size={"xs"} key={url.id}>
								- {url.url}
							</Text>
						))}
					</Stack>
				</Stack>
				{props.progressPercent && (
					<Progress
						animated={props.progressPercent < 100}
						striped={props.progressPercent < 100}
						radius={"xs"}
						value={props.progressPercent}
						color={props.status ? colors[props.status] : "gray"}
					/>
				)}
			</Stack>
		</Paper>
	);
}
