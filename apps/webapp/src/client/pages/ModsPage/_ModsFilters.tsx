import { Stack, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { noop } from "lodash";
import { match } from "ts-pattern";
import { useGetMods } from "../../_autogen/api.ts";
import type { ModFilterFormValues } from "../../components/ModFilterForm.tsx";
import { ModFilterForm } from "../../components/ModFilterForm.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

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

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("BROWSE_MODS")}
			</Text>

			{match(mods.data)
				.when(
					(res) => res?.status === StatusCodes.OK,
					(res) => (
						<ModFilterForm
							initialValues={props.initialValues}
							onSubmit={props.onSubmit}
							categories={res.data.filter.categories}
							users={res.data.filter.maintainers}
							tags={res.data.filter.tags}
						/>
					),
				)
				.otherwise(() => (
					<ModFilterForm loading={true} initialValues={{}} onSubmit={noop} categories={[]} users={[]} tags={[]} />
				))}
		</Stack>
	);
}
