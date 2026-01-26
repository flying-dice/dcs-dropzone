import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, useComputedColorScheme } from "@mantine/core";
import { type I18nKeys, useAppTranslation } from "@packages/dzui";
import { FaFileCode } from "react-icons/fa";
import { ModReleaseMissionScriptDataRoot, ModReleaseMissionScriptDataRunOn } from "../_autogen/api.ts";
import { PathWithRoot } from "./PathWithRoot.tsx";

export type MissionScriptListItemProps = {
	path: string;
	root: ModReleaseMissionScriptDataRoot;
	onClick?: () => void;
	runOn: ModReleaseMissionScriptDataRunOn;
	name: string;
	purpose: string;
};

const missionScriptRootLabels: Record<ModReleaseMissionScriptDataRoot, I18nKeys> = {
	[ModReleaseMissionScriptDataRoot.DCS_WORKING_DIR]: "MISSION_SCRIPT_ROOT_WORKING_DIR",
	[ModReleaseMissionScriptDataRoot.DCS_INSTALL_DIR]: "MISSION_SCRIPT_ROOT_INSTALL_DIR",
};

const missionScriptRunOnLabels: Record<ModReleaseMissionScriptDataRunOn, I18nKeys> = {
	[ModReleaseMissionScriptDataRunOn.MISSION_START_BEFORE_SANITIZE]: "MISSION_SCRIPT_RUN_ON_BEFORE_SANITIZE",
	[ModReleaseMissionScriptDataRunOn.MISSION_START_AFTER_SANITIZE]: "MISSION_SCRIPT_RUN_ON_AFTER_SANITIZE",
};

export function MissionScriptListItem(props: MissionScriptListItemProps) {
	const { t } = useAppTranslation();
	const scheme = useComputedColorScheme();

	return (
		<Paper
			withBorder
			color="violet"
			variant="light"
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
							{t("MISSION_SCRIPT_PATH_LABEL")}:
						</Text>
						<PathWithRoot size={"xs"} path={props.path} root={t(missionScriptRootLabels[props.root])} />
					</Stack>
					<Stack gap={2}>
						<Text size={"xs"} fw={"bold"}>
							{t("MISSION_SCRIPT_RUN_ON_LABEL")}:
						</Text>
						<Text size={"xs"}>{t(missionScriptRunOnLabels[props.runOn])}</Text>
					</Stack>
				</SimpleGrid>

				<Paper p={"md"} bg={scheme === "light" ? "gray.1" : "dark.5"}>
					<Stack gap={"xs"}>
						<Text size={"xs"} fw={"bold"}>
							{t("MISSION_SCRIPT_PURPOSE_LABEL")}:
						</Text>
						<Text size={"xs"}>{props.purpose}</Text>
					</Stack>
				</Paper>
			</Stack>
		</Paper>
	);
}
