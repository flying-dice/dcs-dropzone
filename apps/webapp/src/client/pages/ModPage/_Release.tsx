import { Alert, Group, Stack, Text } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { ModData, ModReleaseData } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export type _ReleaseProps = {
	mod: ModData;
	active?: boolean;
	release: ModReleaseData;
};

export function _Release(props: _ReleaseProps) {
	const { t } = useAppTranslation();
	const nav = useNavigate();

	return (
		<Alert
			p={"xs"}
			style={{ cursor: "pointer" }}
			onClick={() => nav(`/mods/${props.release.modId}/${props.release.id}`)}
			variant={props.active ? "light" : "default"}
		>
			<Stack gap={"xs"}>
				<Group justify={"space-between"}>
					<Text size={"sm"} fw={"bold"}>
						{props.release.version}
					</Text>
					{props.mod.latestReleaseId === props.release.id && (
						<Text style={{ textTransform: "uppercase" }} fw={"bold"} size={"xs"} c={"green"}>
							{t("LATEST")}
						</Text>
					)}
				</Group>
				<Stack gap={0}>
					{props.release.createdAt && (
						<Text size={"xs"} c={"dimmed"} style={{ whiteSpace: "nowrap" }}>
							{t("CREATED_AT_DISTANCE", { distance: formatDistanceToNow(props.release.createdAt) })}
						</Text>
					)}
					<Text size={"xs"} c={"dimmed"} style={{ whiteSpace: "nowrap" }}>
						{t("COUNT_DOWNLOADS", { count: props.release.downloadsCount! })}
					</Text>
				</Stack>
			</Stack>
		</Alert>
	);
}
