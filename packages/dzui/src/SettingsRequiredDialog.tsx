import { Button, Dialog, Stack, Text, Title } from "@mantine/core";
import { AppIcons } from "./icons.ts";
import { useAppTranslation } from "./useAppTranslation.ts";

export type SettingsRequiredDialogProps = {
	opened: boolean;
	onOpenSettings: () => void;
	settingsLoading?: boolean;
};

export function SettingsRequiredDialog({ opened, onOpenSettings, settingsLoading }: SettingsRequiredDialogProps) {
	const { t } = useAppTranslation();

	return (
		<Dialog opened={opened} withCloseButton={false} size="lg" radius="md" withBorder>
			<Stack gap="sm">
				<Title order={5}>{t("SETTINGS_REQUIRED_TITLE")}</Title>
				<Text size="sm">{t("SETTINGS_REQUIRED_DESC")}</Text>
				<Button leftSection={<AppIcons.Settings />} onClick={onOpenSettings} loading={settingsLoading}>
					{t("OPEN_SETTINGS")}
				</Button>
			</Stack>
		</Dialog>
	);
}
