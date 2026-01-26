import { Card, Select, Stack, Text, TextInput } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { ModDataVisibility } from "../../_autogen/api.ts";
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
							value: ModDataVisibility.PUBLIC,
							label: t("PUBLIC"),
						},
						{
							value: ModDataVisibility.UNLISTED,
							label: t("UNLISTED"),
						},
						{
							value: ModDataVisibility.PRIVATE,
							label: t("PRIVATE"),
						},
					]}
				></Select>
			</Stack>
		</Card>
	);
}
