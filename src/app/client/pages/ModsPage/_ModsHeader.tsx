import { Stack, Text } from "@mantine/core";
import { ModFilterForm, type ModFilterFormProps } from "../../components/ModFilterForm.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export function _ModsHeader(props: ModFilterFormProps) {
	const { t } = useAppTranslation();

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("BROWSE_MODS")}
			</Text>

			<ModFilterForm
				initialValues={props.initialValues}
				onSubmit={props.onSubmit}
				categories={props.categories}
				users={props.users}
				tags={props.tags}
			/>
		</Stack>
	);
}
