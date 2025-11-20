import {
	Button,
	Card,
	Center,
	Group,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals, openModal } from "@mantine/modals";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaCamera } from "react-icons/fa6";
import { z } from "zod";
import { ModImage } from "../../components/ModImage.tsx";
import type { UserModForm } from "./form.ts";

const formSchema = z.object({
	thumbnail: z.string().url("Invalid URL format").max(1000),
});

type ThumbnailFormValues = z.infer<typeof formSchema>;

function Form(props: {
	initialValues: ThumbnailFormValues;
	onSubmit: (values: ThumbnailFormValues) => void;
	onCancel: () => void;
}) {
	const form = useForm<ThumbnailFormValues>({
		initialValues: props.initialValues,
		validate: zod4Resolver(formSchema),
	});

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<Textarea
					label={"Image URL"}
					placeholder="Enter image URL"
					name={"thumbnail"}
					autosize
					{...form.getInputProps("thumbnail")}
				/>

				<Card withBorder>
					<Center>
						<ModImage radius={"md"} w={300} src={form.values.thumbnail} />
					</Center>
				</Card>
				<Group justify={"flex-end"}>
					<Button onClick={props.onCancel} variant={"outline"}>
						Cancel
					</Button>
					<Button type="submit">Save</Button>
				</Group>
			</Stack>
		</form>
	);
}

function openThumbnailModal(value: string, onChange: (value: string) => void) {
	openModal({
		title: "Change Thumbnail",
		size: "xl",
		children: (
			<Form
				initialValues={{ thumbnail: value }}
				onSubmit={(values) => {
					onChange(values.thumbnail);
				}}
				onCancel={() => {
					modals.closeAll();
				}}
			/>
		),
	});
}

export function _Thumbnail(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Thumbnail
				</Text>
				<ModImage src={props.form.values.thumbnail} radius={5} />
				<Button
					fw={"normal"}
					variant={"default"}
					leftSection={<FaCamera />}
					onClick={() =>
						openThumbnailModal(props.form.values.thumbnail, (newUrl) => {
							props.form.setFieldValue("thumbnail", newUrl);
							modals.closeAll();
						})
					}
				>
					Change Thumbnail
				</Button>
			</Stack>
		</Card>
	);
}
