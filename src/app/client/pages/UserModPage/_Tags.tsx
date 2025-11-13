import { Card, Stack, Text } from "@mantine/core";
import { AppTagsInput } from "../../components/AppTagsInput.tsx";
import type { UserModForm } from "./form.ts";

export function _Tags(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Tags
				</Text>

				<AppTagsInput
					value={props.form.values.tags}
					onChange={(v) => props.form.setFieldValue("tags", v)}
				/>
			</Stack>
		</Card>
	);
}
