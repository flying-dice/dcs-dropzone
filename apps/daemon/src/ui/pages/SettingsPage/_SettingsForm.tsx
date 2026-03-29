import { Button, Group, Stack, TextInput, Title } from "@mantine/core";
import { usePutSettings } from "@packages/clients/daemon";
import { showErrorNotification, showSuccessNotification, useAppTranslation } from "@packages/dzui";
import { type SettingsFormValues, useSettingsForm } from "./form";

export function _SettingsForm({
	initialValues,
	placeholders,
}: {
	initialValues: SettingsFormValues;
	placeholders?: { dcsWorkingDir?: string; dcsInstallDir?: string; dropzoneModsDir?: string };
}) {
	const { t } = useAppTranslation();
	const putSettings = usePutSettings();
	const form = useSettingsForm(initialValues);

	const handleSubmit = form.onSubmit((values) => {
		putSettings.mutate(
			{ data: values },
			{
				onSuccess: () => {
					showSuccessNotification(t("SETTINGS_SAVED_SUCCESS_TITLE"), t("SETTINGS_SAVED_SUCCESS_DESC"));
				},
				onError: (error) => {
					showErrorNotification(error);
				},
			},
		);
	});

	return (
		<>
			<Title order={2}>{t("SETTINGS_PAGE_TITLE")}</Title>
			<form onSubmit={handleSubmit}>
				<Stack gap="md">
					<TextInput
						withAsterisk
						label={t("SETTINGS_DCS_WORKING_DIR_LABEL")}
						description={t("SETTINGS_DCS_WORKING_DIR_DESCRIPTION")}
						placeholder={placeholders?.dcsWorkingDir ?? ""}
						{...form.getInputProps("dcsWorkingDir")}
					/>
					<TextInput
						withAsterisk
						label={t("SETTINGS_DCS_INSTALL_DIR_LABEL")}
						description={t("SETTINGS_DCS_INSTALL_DIR_DESCRIPTION")}
						placeholder={placeholders?.dcsInstallDir ?? ""}
						{...form.getInputProps("dcsInstallDir")}
					/>
					<TextInput
						withAsterisk
						label={t("SETTINGS_DROPZONE_MODS_DIR_LABEL")}
						description={t("SETTINGS_DROPZONE_MODS_DIR_DESCRIPTION")}
						placeholder={placeholders?.dropzoneModsDir ?? ""}
						{...form.getInputProps("dropzoneModsDir")}
					/>
					<Group justify={"end"}>
						<Button type="submit" loading={putSettings.isPending} mt="sm">
							{t("SAVE")}
						</Button>
					</Group>
				</Stack>
			</form>
		</>
	);
}
