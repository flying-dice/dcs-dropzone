import "@packages/dzui/i18n";
import { Container, Stack } from "@mantine/core";
import { useGetSettings, useGetSettingsSuggestions, useGetSettingsValidation } from "@packages/clients/daemon";
import { DzMain } from "@packages/dzui";
import { _SettingsForm } from "./_SettingsForm";
import type { SettingsFormValues } from "./form";

export function SettingsPage() {
	const settings = useGetSettings();
	const suggestions = useGetSettingsSuggestions();
	const validation = useGetSettingsValidation();

	const initialValues: SettingsFormValues | undefined = settings.data?.data
		? {
				dcsWorkingDir: settings.data.data.dcsWorkingDir ?? "",
				dcsInstallDir: settings.data.data.dcsInstallDir ?? "",
				dropzoneModsDir: settings.data.data.dropzoneModsDir ?? "",
			}
		: undefined;

	return (
		<DzMain>
			<Container size={"sm"}>
				<Stack py="md" gap="xl">
					{initialValues && (
						<_SettingsForm
							key={JSON.stringify(initialValues)}
							initialValues={initialValues}
							placeholders={suggestions.data?.data}
							validation={validation.data?.data}
						/>
					)}
				</Stack>
			</Container>
		</DzMain>
	);
}
