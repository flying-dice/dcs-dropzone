import { Card, Stack, Text } from "@mantine/core";
import type { ModReleaseSymbolicLinkData } from "../../_autogen/api.ts";
import { SymbolicLinkListItem } from "../../components/SymbolicLinkListItem.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export type _InstallationSymbolicLinksProps = {
	symbolicLinks: ModReleaseSymbolicLinkData[];
};

export function _InstallationSymbolicLinks(props: _InstallationSymbolicLinksProps) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text fw={"bold"}>{t("SYMLINK_CONFIGURATION")}</Text>
				<Text size={"sm"} c={"dimmed"}>
					{t(props.symbolicLinks.length > 0 ? "SYMLINK_CONFIGURATION_DESC" : "SYMLINK_CONFIGURATION_DESC_EMPTY")}
				</Text>
				{props.symbolicLinks.map((symbolicLink) => (
					<SymbolicLinkListItem
						key={`${symbolicLink.src}:${symbolicLink.destRoot}/${symbolicLink.dest}`}
						name={symbolicLink.name}
						src={symbolicLink.src}
						dest={symbolicLink.dest}
						destRoot={symbolicLink.destRoot}
					/>
				))}
			</Stack>
		</Card>
	);
}
