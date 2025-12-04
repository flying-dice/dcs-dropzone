import { Group, Pagination, Select, Text } from "@mantine/core";
import { useGetMods } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export function _PaginationControls(props: {
	page: number;
	size: number;
	total: number;
	filters: Record<string, unknown>;
	onPageChange: (page: number) => void;
	onSizeChange: (size: string | null) => void;
}) {
	const { t } = useAppTranslation();
	const mods = useGetMods({
		page: props.page,
		size: props.size,
		...props.filters,
	});

	if (!mods.data || mods.data.status !== 200) {
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
					start: (mods.data.data.page.number - 1) * mods.data.data.page.size + 1,
					end: (mods.data.data.page.number - 1) * mods.data.data.page.size + mods.data.data.data.length,
					total: mods.data.data.page.totalElements,
				})}
			</Text>
			<Pagination total={props.total} onChange={props.onPageChange} value={props.page} />
		</Group>
	);
}
