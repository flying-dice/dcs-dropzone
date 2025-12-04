import { Group, Pagination, Select, Text } from "@mantine/core";
import type { getModsResponse } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export function _PaginationControls(props: {
	mods: getModsResponse | undefined;
	page: number;
	size: number;
	total: number;
	onPageChange: (page: number) => void;
	onSizeChange: (size: string | null) => void;
}) {
	const { t } = useAppTranslation();

	if (!props.mods || props.mods.status !== 200) {
		return null;
	}

	return (
		<Group justify={"space-between"} align={"center"}>
			<Select
				w={75}
				data={["5", "10", "20", "50", "100"]}
				value={props.size.toString()}
				onChange={props.onSizeChange}
			/>
			<Text size={"xs"} c={"dimmed"}>
				{t("DISPLAYING_RANGE", {
					start: (props.mods.data.page.number - 1) * props.mods.data.page.size + 1,
					end: (props.mods.data.page.number - 1) * props.mods.data.page.size + props.mods.data.data.length,
					total: props.mods.data.page.totalElements,
				})}
			</Text>
			<Pagination total={props.total} onChange={props.onPageChange} value={props.page} />
		</Group>
	);
}
