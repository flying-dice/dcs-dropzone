import { Code, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";

export function showDetailedErrorModal(title: string, error: string, detail: string) {
	openModal({
		size: "lg",
		title,
		children: (
			<Stack>
				<Text>{error}</Text>
				<Code block lang={"json"}>
					{detail}
				</Code>
			</Stack>
		),
	});
}
