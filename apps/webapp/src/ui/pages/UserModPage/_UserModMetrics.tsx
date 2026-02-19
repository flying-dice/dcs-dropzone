import { Card, Group, Stack, Text } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";

export function _UserModMetrics(props: { downloads: number }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Quick Stats
				</Text>
				<Group justify={"space-between"}>
					<Text c={"gray"}>{t("TOTAL_DOWNLOADS")}</Text>
					<Text fw={"bold"}>{props.downloads}</Text>
				</Group>
			</Stack>
		</Card>
	);
}
