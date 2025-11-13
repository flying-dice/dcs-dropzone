import { Card, Select, Stack, Text, TextInput } from "@mantine/core";
import { data } from "../../../../common/data.ts";
import type { UserModForm } from "./form.ts";

export function _BasicInfo(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Basic Information
				</Text>
				<TextInput label="Mod Name" {...props.form.getInputProps("name")} />
				<Select
					label={"Category"}
					data={data.categories}
					{...props.form.getInputProps("category")}
				/>
				<TextInput
					label="Short Description"
					{...props.form.getInputProps("description")}
				/>
			</Stack>
		</Card>
	);
}
