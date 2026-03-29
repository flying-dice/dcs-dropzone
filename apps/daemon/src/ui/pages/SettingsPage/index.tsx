import "@packages/dzui/i18n";
import { Button, Container, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useGetSettings, useGetSettingsSuggestions, usePutSettings } from "@packages/clients/daemon";
import { DzMain, showErrorNotification, showSuccessNotification, useAppTranslation } from "@packages/dzui";
import { useEffect } from "react";

export function SettingsPage() {
	const { t } = useAppTranslation();
	const settings = useGetSettings();
	const suggestions = useGetSettingsSuggestions();
	const putSettings = usePutSettings();

	const form = useForm({
		initialValues: {
			dcsWorkingDir: "",
			dcsInstallDir: "",
			dropzoneModsDir: "",
		},
	});

	useEffect(() => {
		if (settings.data?.data) {
			form.setValues({
				dcsWorkingDir: settings.data.data.dcsWorkingDir ?? "",
				dcsInstallDir: settings.data.data.dcsInstallDir ?? "",
				dropzoneModsDir: settings.data.data.dropzoneModsDir ?? "",
			});
		}
	}, [settings.data, form.setValues]);

	const handleSubmit = form.onSubmit((values) => {
		const body: Record<string, string> = {};
		if (values.dcsWorkingDir) body.dcsWorkingDir = values.dcsWorkingDir;
		if (values.dcsInstallDir) body.dcsInstallDir = values.dcsInstallDir;
		if (values.dropzoneModsDir) body.dropzoneModsDir = values.dropzoneModsDir;

		putSettings.mutate(
			{ data: body },
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

	const placeholders = suggestions.data?.data;

	return (
		<DzMain>
			<Container size={"sm"}>
				<Stack py="md" gap="xl">
					<Title order={2}>{t("SETTINGS_PAGE_TITLE")}</Title>
					<form onSubmit={handleSubmit}>
						<Stack gap="md">
							<TextInput
								label={t("SETTINGS_DCS_WORKING_DIR_LABEL")}
								description={t("SETTINGS_DCS_WORKING_DIR_DESCRIPTION")}
								placeholder={placeholders?.dcsWorkingDir ?? ""}
								{...form.getInputProps("dcsWorkingDir")}
							/>
							<TextInput
								label={t("SETTINGS_DCS_INSTALL_DIR_LABEL")}
								description={t("SETTINGS_DCS_INSTALL_DIR_DESCRIPTION")}
								placeholder={placeholders?.dcsInstallDir ?? ""}
								{...form.getInputProps("dcsInstallDir")}
							/>
							<TextInput
								label={t("SETTINGS_DROPZONE_MODS_DIR_LABEL")}
								description={t("SETTINGS_DROPZONE_MODS_DIR_DESCRIPTION")}
								placeholder={placeholders?.dropzoneModsDir ?? ""}
								{...form.getInputProps("dropzoneModsDir")}
							/>
							<Button type="submit" loading={putSettings.isPending} mt="sm">
								{t("SAVE")}
							</Button>
						</Stack>
					</form>
				</Stack>
			</Container>
		</DzMain>
	);
}
