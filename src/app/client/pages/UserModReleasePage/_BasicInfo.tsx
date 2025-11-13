import { Card, Stack, Text, TextInput } from "@mantine/core";
import type { UserModReleaseForm } from "./form.ts";

export function _BasicInfo(props: { form: UserModReleaseForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Release Information
				</Text>
				<TextInput
					label="Release Version"
					{...props.form.getInputProps("version")}
				/>
			</Stack>
		</Card>
	);
}
