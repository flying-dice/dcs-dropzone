import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { type I18nKeys, useAppTranslation } from "@packages/dzui";
import { FaFileCode } from "react-icons/fa";
import { ModReleaseSymbolicLinkDataDestRoot } from "../_autogen/api.ts";
import { PathWithRoot } from "./PathWithRoot.tsx";

export type SymbolicLinkListItemProps = {
	name: string;
	src: string;
	dest: string;
	destRoot: ModReleaseSymbolicLinkDataDestRoot;
	onClick?: () => void;
};

const destRootLabels: Record<ModReleaseSymbolicLinkDataDestRoot, I18nKeys> = {
	[ModReleaseSymbolicLinkDataDestRoot.DCS_WORKING_DIR]: "SYMBOLIC_LINK_DEST_ROOT_WORKING_DIR",
	[ModReleaseSymbolicLinkDataDestRoot.DCS_INSTALL_DIR]: "SYMBOLIC_LINK_DEST_ROOT_INSTALL_DIR",
};

export function SymbolicLinkListItem(props: SymbolicLinkListItemProps) {
	const { t } = useAppTranslation();

	return (
		<Paper
			withBorder
			variant="outline"
			style={props.onClick ? { cursor: "pointer" } : {}}
			onClick={props.onClick}
			p={"md"}
		>
			<Stack>
				<Group>
					<ThemeIcon variant={"light"}>
						<FaFileCode />
					</ThemeIcon>
					<Text>{props.name}</Text>
				</Group>

				<SimpleGrid cols={2}>
					<Stack gap={2}>
						<Text size={"xs"} fw={"bold"}>
							{t("SYMBOLIC_LINK_SRC_LABEL")}:
						</Text>
						<Text size={"xs"}>{props.src}</Text>
					</Stack>
					<Stack gap={2}>
						<Text size={"xs"} fw={"bold"}>
							{t("SYMBOLIC_LINK_DEST_LABEL")}:
						</Text>
						<PathWithRoot size={"xs"} path={props.dest} root={t(destRootLabels[props.destRoot])} />
					</Stack>
				</SimpleGrid>
			</Stack>
		</Paper>
	);
}
