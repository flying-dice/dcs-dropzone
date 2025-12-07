import { useForm } from "@mantine/form";
import { zKebabCaseString } from "common/zod";
import { StatusCodes } from "http-status-codes";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useAsyncFn } from "react-use";
import { z } from "zod";
import { type ModData, ModDataCategory, ModDataVisibility, type UserData, updateUserMod } from "../../_autogen/api.ts";
import { showErrorNotification } from "../../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";

export const userModFormValues = z.object({
	name: z.string().min(2, { message: "Name should have at least 2 letters" }),
	category: z.enum(ModDataCategory),
	description: z.string().min(10, { message: "Short Description should have at least 10 letters" }).max(100, {
		message: "Short Description should have at most 100 letters",
	}),
	content: z.string().min(20, {
		message: "Detailed Description should have at least 20 letters",
	}),
	tags: zKebabCaseString.array(),
	dependencies: z.array(z.string()),
	thumbnail: z.string().url(),
	screenshots: z.string().url().array(),
	visibility: z.enum(ModDataVisibility),
});

export type UserModFormValues = z.infer<typeof userModFormValues>;

export const useUserModForm = (mod: ModData) =>
	useForm<UserModFormValues>({
		initialValues: {
			name: mod.name,
			category: mod.category,
			description: mod.description,
			content: mod.content,
			tags: mod.tags,
			dependencies: mod.dependencies,
			thumbnail: mod.thumbnail,
			screenshots: mod.screenshots,
			visibility: mod.visibility,
		},
		validate: zod4Resolver(userModFormValues),
	});

export type UserModForm = ReturnType<typeof useUserModForm>;

export const useUserModFormSubmit = (mod: ModData, user: UserData, onSuccess: () => Promise<void> | void) =>
	useAsyncFn(
		async (values: UserModFormValues) => {
			try {
				const res = await updateUserMod(mod.id, {
					category: values.category,
					content: values.content,
					dependencies: values.dependencies,
					description: values.description,
					maintainers: [user.id],
					name: values.name,
					screenshots: values.screenshots,
					tags: values.tags,
					thumbnail: values.thumbnail,
					visibility: values.visibility,
				});
				if (res.status === StatusCodes.OK) {
					await onSuccess();
					showSuccessNotification("Mod updated successfully!", "Your mod has been updated.");
				} else {
					showErrorNotification(new Error(`Error updating user mod with status code ${res.status}`));
				}
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[mod, user, onSuccess],
	);
