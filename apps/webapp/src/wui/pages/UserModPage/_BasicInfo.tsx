import { Card, Select, Stack, Text, TextInput } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { ModDataCategory } from "../../_autogen/api.ts";
import type { UserModForm } from "./form.ts";

export function _BasicInfo(props: { form: UserModForm }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					{t("BASIC_INFORMATION")}
				</Text>
				<TextInput label={t("MOD_NAME")} {...props.form.getInputProps("name")} />
				<Select label={t("CATEGORY")} data={Object.values(ModDataCategory)} {...props.form.getInputProps("category")} />
				<TextInput label={t("DESCRIPTION")} {...props.form.getInputProps("description")} />
			</Stack>
		</Card>
	);
}
