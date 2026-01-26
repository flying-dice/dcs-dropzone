import { Card, Stack, Text } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import type { ModReleaseMissionScriptData } from "../../_autogen/api.ts";
import { MissionScriptListItem } from "../../components/MissionScriptListItem.tsx";

export type _InstallationMissionScriptsProps = {
	missionScripts: ModReleaseMissionScriptData[];
};

export function _InstallationMissionScripts(props: _InstallationMissionScriptsProps) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text fw={"bold"}>{t("MISSION_SCRIPTS_TITLE")}</Text>
				<Text size={"sm"} c={"dimmed"}>
					{t(props.missionScripts.length > 0 ? "MISSION_SCRIPTS_DESC" : "MISSION_SCRIPTS_DESC_EMPTY")}
				</Text>
				{props.missionScripts.map((missionScript) => (
					<MissionScriptListItem
						key={`${missionScript.root}/${missionScript.path}`}
						name={missionScript.name}
						path={missionScript.path}
						root={missionScript.root}
						purpose={missionScript.purpose}
						runOn={missionScript.runOn}
					/>
				))}
			</Stack>
		</Card>
	);
}
