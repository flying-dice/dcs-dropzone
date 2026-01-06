import { Button, Group, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { ModDataCategory } from "../_autogen/api.ts";

export const NewModFormSchema = z.object({
	name: z.string().min(2, { message: "Name should have at least 2 letters" }),
	description: z.string().min(10, { message: "Short Description should have at least 10 letters" }),
	category: z.enum(ModDataCategory),
});

export type NewModFormValues = z.infer<typeof NewModFormSchema>;

export type NewModFormProps = {
	onSubmit: (values: NewModFormValues) => Promise<void>;
	onCancel: () => void;
};

export function NewModForm(props: NewModFormProps) {
	const form = useForm({
		initialValues: {
			name: "New Mod",
			description: "Add a short description...",
			category: ModDataCategory.MOD,
		},
		validate: zod4Resolver(NewModFormSchema),
	});

	return (
		<Stack>
			<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
				<Stack>
					<TextInput {...form.getInputProps("name")} label="Mod Name" />
					<Textarea autosize minRows={3} {...form.getInputProps("description")} label="Short Description" />
					<Select {...form.getInputProps("category")} label="Category" data={Object.values(ModDataCategory)} />
					<Group>
						<Button variant={"default"} onClick={props.onCancel}>
							Cancel
						</Button>
						<Button type="submit">Create Mod</Button>
					</Group>
				</Stack>
			</form>
		</Stack>
	);
}
