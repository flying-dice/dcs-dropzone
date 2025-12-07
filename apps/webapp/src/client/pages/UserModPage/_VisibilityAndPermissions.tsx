import { Card, Select, Stack, Text } from "@mantine/core";
import { ModDataVisibility } from "../../_autogen/api.ts";
import type { UserModForm } from "./form.ts";

export function _VisibilityAndPermissions(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Visibility & Permissions
				</Text>
				<Select
					label={"Visibility"}
					{...props.form.getInputProps("visibility")}
					data={Object.values(ModDataVisibility)}
				/>
			</Stack>
		</Card>
	);
}
