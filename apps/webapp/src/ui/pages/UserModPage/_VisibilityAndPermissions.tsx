import { Card, Select, Stack, Text } from "@mantine/core";
import { ModDataVisibility } from "@packages/clients/webapp";
import { MOD_VISIBILITY_TEST_ID } from "@packages/testids";
import type { UserModForm } from "./form.ts";

export function _VisibilityAndPermissions(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Visibility & Permissions
				</Text>
				<Select
					data-testid={MOD_VISIBILITY_TEST_ID}
					label={"Visibility"}
					{...props.form.getInputProps("visibility")}
					data={Object.values(ModDataVisibility)}
				/>
			</Stack>
		</Card>
	);
}
