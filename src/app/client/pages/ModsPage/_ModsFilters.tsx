import { Stack, Text } from "@mantine/core";
import { HttpStatusCode } from "axios";
import { useGetMods } from "../../_autogen/api.ts";
import type { ModFilterFormValues } from "../../components/ModFilterForm.tsx";
import { ModFilterForm } from "../../components/ModFilterForm.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { modFilterService } from "../../services/modFilterService.ts";

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
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.categories
			? modFilterService.transformCategories(mods.data.data.filter.categories, t)
			: [];

	const usersData =
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.maintainers
			? modFilterService.transformMaintainers(mods.data.data.filter.maintainers)
			: [];

	const tagsData =
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.tags
			? modFilterService.transformTags(mods.data.data.filter.tags)
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
