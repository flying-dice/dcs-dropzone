import { Stack, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useGetMods } from "../../_autogen/api.ts";
import type { ModFilterFormValues } from "../../components/ModFilterForm.tsx";
import { ModFilterForm } from "../../components/ModFilterForm.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { transformCategories } from "../../utils/transformCategories.ts";
import { transformMaintainers } from "../../utils/transformMaintainers.ts";
import { transformTags } from "../../utils/transformTags.ts";

export function _ModsFilters(props: {
	initialValues: ModFilterFormValues;
	onSubmit: (values: ModFilterFormValues) => void;
	page: number;
	size: number;
	filters: Record<string, unknown>;
}) {
	const { t } = useAppTranslation();
	const mods = useGetMods({
		page: props.page,
		size: props.size,
		...props.filters,
	});

	const categoriesData =
		mods.data?.status === StatusCodes.OK && mods.data?.data.filter.categories
			? transformCategories(mods.data.data.filter.categories, t)
			: [];

	const usersData =
		mods.data?.status === StatusCodes.OK && mods.data?.data.filter.maintainers
			? transformMaintainers(mods.data.data.filter.maintainers)
			: [];

	const tagsData =
		mods.data?.status === StatusCodes.OK && mods.data?.data.filter.tags
			? transformTags(mods.data.data.filter.tags)
			: [];

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("BROWSE_MODS")}
			</Text>

			<ModFilterForm
				initialValues={props.initialValues}
				onSubmit={props.onSubmit}
				categories={categoriesData}
				users={usersData}
				tags={tagsData}
			/>
		</Stack>
	);
}
