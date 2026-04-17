import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CREATE_RELEASE_SUBMIT_TEST_ID, NEW_RELEASE_VERSION_TEST_ID } from "@packages/testids";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";

export const NewReleaseFormSchema = z.object({
	version: z.string().min(1, "Version is required"),
});

export type NewReleaseFormValues = z.infer<typeof NewReleaseFormSchema>;

export type NewReleaseFormProps = {
	onSubmit: (values: NewReleaseFormValues) => Promise<void>;
	onCancel: () => void;
};

export function NewReleaseForm(props: NewReleaseFormProps) {
	const form = useForm({
		initialValues: {
			version: "",
		},
		validate: zod4Resolver(NewReleaseFormSchema),
	});

	return (
		<Stack>
			<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
				<Stack>
					<TextInput data-testid={NEW_RELEASE_VERSION_TEST_ID} {...form.getInputProps("version")} label="Release Version" />
					<Group>
						<Button variant={"default"} onClick={props.onCancel}>
							Cancel
						</Button>
						<Button data-testid={CREATE_RELEASE_SUBMIT_TEST_ID} type="submit">
							Create Release
						</Button>
					</Group>
				</Stack>
			</form>
		</Stack>
	);
}
