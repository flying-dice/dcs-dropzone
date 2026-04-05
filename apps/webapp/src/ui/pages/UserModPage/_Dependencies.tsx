import { Card, Stack, Text } from "@mantine/core";
import { AppDependenciesInput } from "../../components/AppDependenciesInput.tsx";
import type { UserModForm } from "./form.ts";

export function _Dependencies(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Dependencies
				</Text>

				<AppDependenciesInput
					value={props.form.values.dependencies}
					onChange={(v) => props.form.setFieldValue("dependencies", v)}
				/>
			</Stack>
		</Card>
	);
}
