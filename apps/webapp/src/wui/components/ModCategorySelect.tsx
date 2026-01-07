import { Select, type SelectProps } from "@mantine/core";
import type { ModDataCategory } from "../_autogen/api.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";

export type ModCategorySelectProps = Omit<SelectProps, "data"> & {
	data: ModDataCategory[];
};

export function ModCategorySelect(props: ModCategorySelectProps) {
	const { t } = useAppTranslation();

	const data: SelectProps["data"] = props.data.map((category) => ({
		value: category,
		label: t(category as any),
	}));

	return <Select {...props} data={data} />;
}
