import { Alert, Anchor, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useAppTranslation } from "@packages/dzui";
import type { ModData, ModReleaseData } from "../../_autogen/api.ts";
import { Markdown } from "../../components/Markdown.tsx";
import { _InstallationDownloadAssets } from "./_InstallationDownloadAssets.tsx";
import { _InstallationMissionScripts } from "./_InstallationMissionScripts.tsx";
import { _InstallationSymbolicLinks } from "./_InstallationSymbolicLinks.tsx";

export type _InstallationProps = {
	mod: ModData;
	latestRelease: ModReleaseData;
	countScriptsBeforeSanitize?: number;
};

export function _Installation(props: _InstallationProps) {
	const { t } = useAppTranslation();

	return (
		<Stack>
			{props.countScriptsBeforeSanitize ? (
				<Alert color={"orange"} title={t("SCRIPT_EXECUTION_NOTICE_TITLE")}>
					<Stack>
						<Stack gap={"xs"}>
							<Text size={"sm"}>
								{t("SCRIPT_EXECUTION_NOTICE_DESC_1", { countScriptsBeforeSanitize: props.countScriptsBeforeSanitize })}
							</Text>
							<Text size={"sm"}>{t("SCRIPT_EXECUTION_NOTICE_DESC_2")}</Text>
							<Text size={"sm"}>{t("SCRIPT_EXECUTION_NOTICE_DESC_3")}</Text>
						</Stack>
						<Anchor
							size={"sm"}
							onClick={() =>
								openModal({
									withCloseButton: false,
									size: "xl",
									children: <Markdown content={t("SANITIZE_HELP_DESC_MD")} />,
								})
							}
						>
							{t("SCRIPT_EXECUTION_NOTICE_MD_LINK_TEXT")}
						</Anchor>
					</Stack>
				</Alert>
			) : undefined}
			<_InstallationDownloadAssets assets={props.latestRelease.assets} />
			<_InstallationSymbolicLinks symbolicLinks={props.latestRelease.symbolicLinks} />
			<_InstallationMissionScripts missionScripts={props.latestRelease.missionScripts} />
		</Stack>
	);
}
