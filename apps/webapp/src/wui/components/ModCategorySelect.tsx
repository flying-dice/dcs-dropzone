import { Select, type SelectProps } from "@mantine/core";
import type { ModDataCategory } from "@packages/clients/webapp";
import { useAppTranslation } from "@packages/dzui";

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
