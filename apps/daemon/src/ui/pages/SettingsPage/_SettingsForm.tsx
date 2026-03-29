import { Button, Group, Stack, TextInput, Title } from "@mantine/core";
import type { GetSettingsValidation200 } from "@packages/clients/daemon";
import { getGetSettingsUrl, getGetSettingsValidationUrl, usePutSettings } from "@packages/clients/daemon";
import {
	showErrorNotification,
	showSuccessNotification,
	type TranslateFunction,
	useAppTranslation,
} from "@packages/dzui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { type SettingsFormValues, useSettingsForm } from "./form";

type ValidationEntry = { exists: boolean; resolvedPath?: string; error?: string };

function getFieldError(entry: ValidationEntry | undefined, t: TranslateFunction): string | null {
	if (!entry || entry.exists) return null;

	if (entry.resolvedPath && entry.error) {
		return t("SETTINGS_ERROR_FAILED", { dir: entry.resolvedPath, err: entry.error });
	}

	if (entry.resolvedPath && !entry.exists) {
		return t("SETTINGS_ERROR_NOT_FOUND", { dir: entry.resolvedPath });
	}

	if (!entry.resolvedPath && !entry.exists) {
		return t("SETTINGS_ERROR_NOT_RESOLVED");
	}

	return t("SETTINGS_ERROR_UNEXPECTED");
}

export function _SettingsForm({
	initialValues,
	placeholders,
	validation,
}: {
	initialValues: SettingsFormValues;
	placeholders?: { dcsWorkingDir?: string; dcsInstallDir?: string; dropzoneModsDir?: string };
	validation?: GetSettingsValidation200;
}) {
	const { t } = useAppTranslation();
	const queryClient = useQueryClient();
	const putSettings = usePutSettings();
	const form = useSettingsForm(initialValues);

	useEffect(() => {
		if (!validation) return;
		const errors: Record<string, string> = {};

		const dcsWorkingDirError = getFieldError(validation.dcsWorkingDir, t);
		if (dcsWorkingDirError) errors.dcsWorkingDir = dcsWorkingDirError;

		const dcsInstallDirError = getFieldError(validation.dcsInstallDir, t);
		if (dcsInstallDirError) errors.dcsInstallDir = dcsInstallDirError;

		const dropzoneModsDirError = getFieldError(validation.dropzoneModsDir, t);
		if (dropzoneModsDirError) errors.dropzoneModsDir = dropzoneModsDirError;

		if (Object.keys(errors).length > 0) {
			form.setErrors(errors);
		}
	}, [validation, t, form.setErrors]);

	const invalidateQueries = () => {
		queryClient.invalidateQueries({ queryKey: [getGetSettingsValidationUrl()] });
		queryClient.invalidateQueries({ queryKey: [getGetSettingsUrl()] });
	};

	const handleSubmit = form.onSubmit((values) => {
		putSettings.mutate(
			{ data: values },
			{
				onSuccess: () => {
					invalidateQueries();
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
					<Group justify={"end"}>
						<Button type="submit" loading={putSettings.isPending}>
							{t("SAVE")}
						</Button>
					</Group>
				</Stack>
			</form>
		</>
	);
}
