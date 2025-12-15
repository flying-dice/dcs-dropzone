import { Card, Stack, Text } from "@mantine/core";
import type { ModReleaseMissionScriptData } from "../../_autogen/api.ts";
import { MissionScriptListItem } from "../../components/MissionScriptListItem.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export type _InstallationMissionScriptsProps = {
	missionScripts: ModReleaseMissionScriptData[];
};

export function _InstallationMissionScripts(props: _InstallationMissionScriptsProps) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text fw={"bold"}>{t("SYMLINK_CONFIGURATION")}</Text>
				<Text size={"sm"} c={"dimmed"}>
					{t("SYMLINK_CONFIGURATION_DESC")}
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
