import { Card, Stack, Text } from "@mantine/core";
import type { ModReleaseAssetData } from "../../_autogen/api.ts";
import { AssetListItem } from "../../components/AssetListItem.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export type _InstallationDownloadAssetsProps = {
	assets: ModReleaseAssetData[];
};

export function _InstallationDownloadAssets(props: _InstallationDownloadAssetsProps) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text fw={"bold"}>{t("DOWNLOAD_ASSETS")}</Text>
				<Text size={"sm"} c={"dimmed"}>
					{t(props.assets.length > 0 ? "DOWNLOAD_ASSETS_DESC" : "DOWNLOAD_ASSETS_DESC_EMPTY")}
				</Text>
				{props.assets.map((asset) => (
					<AssetListItem key={asset.name} name={asset.name} urls={asset.urls} isArchive={asset.isArchive} />
				))}
			</Stack>
		</Card>
	);
}
