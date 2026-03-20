import { Card, Group, Stack, Text } from "@mantine/core";
import type { ModAndReleaseData } from "@packages/clients/daemon";
import { AssetListItem } from "./AssetListItem.tsx";
import { Help } from "./Help.tsx";
import { MissionScriptListItem } from "./MissionScriptListItem.tsx";
import { NoAssets } from "./NoAssets.tsx";
import { NoMissionScripts } from "./NoMissionScripts.tsx";
import { NoSymbolicLinks } from "./NoSymbolicLinks.tsx";
import { SymbolicLinkListItem } from "./SymbolicLinkListItem.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";

export type DownloadedModInformationProps = {
	mod: ModAndReleaseData;
};
export function DownloadedModInformation(props: DownloadedModInformationProps) {
	const { t } = useAppTranslation();

	return (
		<Stack>
			<Card withBorder>
				<Stack>
					<Group justify={"space-between"}>
						<Text size={"lg"} fw={"bold"}>
							Assets
						</Text>
						<Group gap={"xs"}>
							<Help title={<Text fw={"bold"}>Assets</Text>} markdown={t("ASSET_HELP_MD")} />
						</Group>
					</Group>
					{props.mod.assets.length === 0 && <NoAssets />}
					{props.mod.assets.map((it) => (
						<AssetListItem
							key={it.id}
							data-testid={`asset-item-${it.name}`}
							name={it.name}
							urls={it.urls}
							isArchive={it.isArchive}
						/>
					))}
				</Stack>
			</Card>
			<Card withBorder>
				<Stack>
					<Group justify={"space-between"}>
						<Text size={"lg"} fw={"bold"}>
							{t("MISSION_SCRIPTS_TITLE")}
						</Text>
						<Group gap={"xs"}>
							<Help
								title={<Text fw={"bold"}>{t("MISSION_SCRIPTS_TITLE")}</Text>}
								markdown={t("MISSION_SCRIPT_HELP_MD")}
							/>
						</Group>
					</Group>
					{props.mod.missionScripts.length === 0 && <NoMissionScripts />}
					{props.mod.missionScripts.map((it, index) => (
						<MissionScriptListItem
							// biome-ignore lint/suspicious/noArrayIndexKey: TODO: Fix
							key={`${it.path}-${it.root}-${it.runOn}-${index}`}
							name={it.name}
							root={it.root}
							runOn={it.runOn}
							path={it.path}
							purpose={it.purpose}
						/>
					))}
				</Stack>
			</Card>
			<Card withBorder>
				<Stack>
					<Group justify={"space-between"}>
						<Text size={"lg"} fw={"bold"}>
							{t("SYMBOLIC_LINKS_TITLE")}
						</Text>
						<Group gap={"xs"}>
							<Help
								title={<Text fw={"bold"}>{t("SYMBOLIC_LINKS_TITLE")}</Text>}
								markdown={t("SYMBOLIC_LINK_HELP_MD")}
							/>
						</Group>
					</Group>
					{props.mod.symbolicLinks.length === 0 && <NoSymbolicLinks />}
					{props.mod.symbolicLinks.map((it, index) => (
						<SymbolicLinkListItem
							// biome-ignore lint/suspicious/noArrayIndexKey: TODO: Fix
							key={`${it.src}-${it.dest}-${index}`}
							data-testid={`symlink-item-${it.name}`}
							name={it.name}
							src={it.src}
							dest={it.dest}
							destRoot={it.destRoot}
							installedPath={it.installedPath}
						/>
					))}
				</Stack>
			</Card>
		</Stack>
	);
}
