import { Code, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useAppTranslation } from "@packages/dzui";
import { FaExclamationTriangle } from "react-icons/fa";

export function useErrorModal() {
	const { t } = useAppTranslation();

	return (error: string) =>
		openModal({
			size: "xl",
			title: (
				<Group>
					<ThemeIcon color={"red"} variant={"light"}>
						<FaExclamationTriangle />
					</ThemeIcon>
					<Text fw={"bold"}>{t("ERROR_TAKING_ACTION_TITLE")}</Text>
				</Group>
			),
			children: (
				<Stack>
					<Text size={"sm"}>{t("ERROR_TAKING_ACTION_DESC")}</Text>
					<Code
						block
						style={{
							fontSize: "var(--mantine-font-size-sm)",
							whiteSpace: "pre-wrap",
							wordWrap: "break-word",
							overflowWrap: "break-word",
						}}
					>
						{error}
					</Code>
				</Stack>
			),
			color: "red",
		});
}
