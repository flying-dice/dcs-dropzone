import { useForm } from "@mantine/form";
import { StatusCodes } from "http-status-codes";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useAsyncFn } from "react-use";
import { z } from "zod";
import {
	type ModData,
	type ModReleaseData,
	ModReleaseDataVisibility,
	ModReleaseMissionScriptDataRoot,
	ModReleaseMissionScriptDataRunOn,
	ModReleaseSymbolicLinkDataDestRoot,
	type UserData,
	updateUserModRelease,
} from "../../_autogen/api.ts";
import { showErrorNotification } from "../../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";

export const userModReleaseFormValues = z.object({
	version: z.string(),
	visibility: z.enum(ModReleaseDataVisibility),
	changelog: z.string().min(10),
	assets: z
		.object({
			name: z.string(),
			urls: z.string().url().array(),
			isArchive: z.boolean(),
		})
		.array(),
	symbolicLinks: z
		.object({
			name: z.string().min(1, "Name is required"),
			src: z.string().min(1, "Source path is required"),
			dest: z.string().min(1, "Destination path is required"),
			destRoot: z.enum(ModReleaseSymbolicLinkDataDestRoot),
		})
		.array()
		.default([]),
	missionScripts: z
		.object({
			name: z.string().min(1, "Name is required"),
			purpose: z.string().min(1, "Purpose is required"),
			path: z.string().min(1, "Path is required"),
			root: z.enum(ModReleaseMissionScriptDataRoot),
			runOn: z.enum(ModReleaseMissionScriptDataRunOn),
		})
		.array()
		.default([]),
});

export type UserModReleaseFormValues = z.infer<typeof userModReleaseFormValues>;

export const useUserModReleaseForm = (_mod: ModData, release: ModReleaseData) =>
	useForm<UserModReleaseFormValues>({
		initialValues: {
			version: release.version,
			visibility: release.visibility,
			changelog: release.changelog,
			assets: release.assets,
			symbolicLinks: release.symbolicLinks || [],
			missionScripts: release.missionScripts || [],
		},
		validate: zod4Resolver(userModReleaseFormValues),
	});

export type UserModReleaseForm = ReturnType<typeof useUserModReleaseForm>;

export const useUserModReleaseFormSubmit = (
	mod: ModData,
	release: ModReleaseData,
	user: UserData,
	onSuccess: () => Promise<void> | void,
) =>
	useAsyncFn(
		async (values: UserModReleaseFormValues) => {
			try {
				const res = await updateUserModRelease(mod.id, release.id, {
					version: values.version,
					visibility: values.visibility,
					changelog: values.changelog,
					assets: values.assets,
					symbolicLinks: values.symbolicLinks,
					missionScripts: values.missionScripts,
				});
				if (res.status === StatusCodes.OK) {
					await onSuccess();
					showSuccessNotification("Release updated successfully!", "Your release has been updated.");
				} else {
					showErrorNotification(new Error(`Error updating release with status code ${res.status}`));
				}
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[mod, user, onSuccess],
	);
