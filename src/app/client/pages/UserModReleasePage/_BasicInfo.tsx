import { Card, Select, Stack, Text, TextInput } from "@mantine/core";
import { ModVisibility } from "../../../../common/data.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "./form.ts";

export function _BasicInfo(props: { form: UserModReleaseForm }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Release Information
				</Text>
				<TextInput label="Release Version" {...props.form.getInputProps("version")} />
				<Select
					{...props.form.getInputProps("visibility")}
					label={"Visibility"}
					data={[
						{
							value: ModVisibility.PUBLIC,
							label: t("PUBLIC"),
						},
						{
							value: ModVisibility.UNLISTED,
							label: t("UNLISTED"),
						},
						{
							value: ModVisibility.PRIVATE,
							label: t("PRIVATE"),
						},
					]}
				></Select>
			</Stack>
		</Card>
	);
}
