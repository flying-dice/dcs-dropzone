import { Group, Paper, SimpleGrid, Stack, Text, TextInput, ThemeIcon } from "@mantine/core";
import { ModReleaseSymbolicLinkDataDestRoot } from "@packages/clients/webapp";
import { FaFileCode } from "react-icons/fa";
import { TbFileSymlink } from "react-icons/tb";
import type { I18nKeys } from "./I18nKeys.ts";
import { PathWithRoot } from "./PathWithRoot.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";

export type SymbolicLinkListItemProps = {
	name: string;
	src: string;
	dest: string;
	destRoot: ModReleaseSymbolicLinkDataDestRoot;
	onClick?: () => void;
	"data-testid"?: string;
	installedPath?: string | null;
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
			data-testid={props["data-testid"]}
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

				{props.installedPath && (
					<TextInput
						size={"sm"}
						leftSection={<TbFileSymlink />}
						value={props.installedPath ?? ""}
						label={t("SYMBOLIC_LINK_INSTALLED_PATH_LABEL")}
						readOnly
					/>
				)}
			</Stack>
		</Paper>
	);
}
