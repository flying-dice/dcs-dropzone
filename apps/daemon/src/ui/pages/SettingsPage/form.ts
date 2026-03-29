import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";

export const settingsFormSchema = z.object({
	dcsWorkingDir: z.string(),
	dcsInstallDir: z.string(),
	dropzoneModsDir: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const useSettingsForm = (initialValues: SettingsFormValues) =>
	useForm<SettingsFormValues>({
		initialValues,
		validate: zod4Resolver(settingsFormSchema),
	});

export type SettingsForm = ReturnType<typeof useSettingsForm>;
