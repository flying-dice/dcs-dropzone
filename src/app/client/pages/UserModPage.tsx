import {
	AppShell,
	Button,
	Card,
	Container,
	FileButton,
	Flex,
	Group,
	Image,
	Rating,
	Select,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	TextInput,
	useComputedColorScheme,
} from "@mantine/core";
import { type UseFormReturnType, useForm } from "@mantine/form";
import { modals, openConfirmModal } from "@mantine/modals";
import { StatusCodes } from "http-status-codes";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useMemo } from "react";
import { FaCamera } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { data } from "../../../common/data.ts";
import {
	deleteUserMod,
	type ModData,
	ModDataCategory,
	ModDataVisibility,
	type UserData,
	updateUserMod,
	useGetUserModById,
	useGetUserMods,
} from "../_autogen/api.ts";
import { AppDependenciesInput } from "../components/AppDependenciesInput.tsx";
import { AppTagsInput } from "../components/AppTagsInput.tsx";
import { Markdown } from "../components/Markdown.tsx";
import { MarkdownEditor } from "../components/MarkdownEditor.tsx";
import { ModImage } from "../components/ModImage.tsx";
import { fileToDataURI } from "../utils/fileToDataUri.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../utils/showSuccessNotification.tsx";

const userModFormValues = z.object({
	name: z.string().min(2, { message: "Name should have at least 2 letters" }),
	category: z.enum(ModDataCategory),
	description: z
		.string()
		.min(10, { message: "Short Description should have at least 10 letters" }),
	content: z.string().min(20, {
		message: "Detailed Description should have at least 20 letters",
	}),
	tags: z.array(z.string()),
	dependencies: z.array(z.string()),
	thumbnail: z.string().url(),
	screenshots: z.array(z.string().url()),
	visibility: z.enum(ModDataVisibility),
});
export type UserModFormValues = z.infer<typeof userModFormValues>;

export function UserModPage(props: { user: UserData }) {
	const params = useParams<{ modId: string }>();
	const mod = useGetUserModById(params.modId || "undefined");

	if (mod.isLoading) {
		return <div>Loading...</div>;
	}

	if (mod.isError || !mod.data) {
		return <div>Error loading mod.</div>;
	}

	if (mod.data.status !== StatusCodes.OK) {
		return <div>Error: {mod.status}</div>;
	}

	return <_UserModPage user={props.user} mod={mod.data.data} />;
}

type UserModPageProps = {
	user: UserData;
	mod: ModData;
};

function _UserModPage(props: UserModPageProps) {
	const userMods = useGetUserMods();
	const mod = useGetUserModById(props.mod.id);

	const colorScheme = useComputedColorScheme();

	const form = useForm<UserModFormValues>({
		initialValues: props.mod,
		validate: zod4Resolver(userModFormValues),
	});

	const handleSubmit = useMemo(
		() =>
			_handleSubmit(props.user, props.mod, async () => {
				await mod.refetch();
				await userMods.refetch();
			}),
		[props.user, props.mod, mod.refetch, userMods.refetch],
	);

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"} p={"md"}>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Flex gap={"md"}>
						<Stack flex={"auto"} gap={"lg"}>
							<_BasicInfo form={form} />
							<_Description form={form} />
							<_Tags form={form} />
							<_Dependencies form={form} />
						</Stack>
						<Stack>
							<_Thumbnail form={form} />
							<_Screenshots form={form} />
							<_VisibilityAndPermissions form={form} />
							<_UserModRating subscriptions={0} rating={0} />
							<_FormActions form={form} mod={props.mod} />
						</Stack>
					</Flex>
				</form>
			</Container>
		</AppShell.Main>
	);
}

const _handleSubmit =
	(user: UserData, mod: ModData, refetch: () => Promise<void>) =>
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
				await refetch();
				showSuccessNotification(
					"Mod updated successfully!",
					"Your mod has been updated.",
				);
			} else {
				showErrorNotification(
					new Error(`Error updating user mod with status code ${res.status}`),
				);
			}
		} catch (e) {
			showErrorNotification(e);
		}
	};

function _BasicInfo(props: { form: UseFormReturnType<UserModFormValues> }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Basic Information
				</Text>
				<TextInput label="Mod Name" {...props.form.getInputProps("name")} />
				<Select
					label={"Category"}
					data={data.categories}
					{...props.form.getInputProps("category")}
				/>
				<TextInput
					label="Short Description"
					{...props.form.getInputProps("description")}
				/>
			</Stack>
		</Card>
	);
}

function _Description(props: { form: UseFormReturnType<UserModFormValues> }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Detailed Description
				</Text>
				<Tabs defaultValue={"write"}>
					<Tabs.List>
						<Tabs.Tab value="write">Write</Tabs.Tab>
						<Tabs.Tab value="preview">Preview</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="write">
						<MarkdownEditor
							value={props.form.values.content}
							onChange={(v) => props.form.setFieldValue("content", v)}
						/>
					</Tabs.Panel>
					<Tabs.Panel value="preview">
						<Card withBorder my={"md"}>
							<Markdown content={props.form.values.content} />
						</Card>
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Card>
	);
}

function _Tags(props: { form: UseFormReturnType<UserModFormValues> }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Tags
				</Text>

				<AppTagsInput
					value={props.form.values.tags}
					onChange={(v) => props.form.setFieldValue("tags", v)}
				/>
			</Stack>
		</Card>
	);
}

function _Dependencies(props: { form: UseFormReturnType<UserModFormValues> }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Dependencies
				</Text>

				<AppDependenciesInput
					value={props.form.values.dependencies}
					onChange={(v) => props.form.setFieldValue("dependencies", v)}
				/>
			</Stack>
		</Card>
	);
}

function _Thumbnail(props: { form: UseFormReturnType<UserModFormValues> }) {
	const handleFileChange = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			props.form.setFieldValue("thumbnail", uploadedImageUrl);
		}
	};

	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Thumbnail
				</Text>
				<ModImage src={props.form.values.thumbnail} w={300} radius={5} />
				<FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
					{(props) => (
						<Button
							{...props}
							fw={"normal"}
							variant={"default"}
							leftSection={<FaCamera />}
						>
							Change Thumbnail
						</Button>
					)}
				</FileButton>
			</Stack>
		</Card>
	);
}

function _Screenshots(props: { form: UseFormReturnType<UserModFormValues> }) {
	const handleNewScreenshot = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			props.form.setFieldValue("screenshots", [
				...props.form.values.screenshots,
				uploadedImageUrl,
			]);
		}
	};

	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Screenshots
				</Text>
				<SimpleGrid cols={2}>
					{props.form.values.screenshots.map((screenshot) => (
						<Image key={screenshot} h={150} radius={"md"} src={screenshot} />
					))}
				</SimpleGrid>
				<FileButton
					onChange={handleNewScreenshot}
					accept="image/png,image/jpeg"
				>
					{(props) => (
						<Button
							{...props}
							fw={"normal"}
							variant={"default"}
							leftSection={<FaCamera />}
						>
							Upload Screenshot
						</Button>
					)}
				</FileButton>
			</Stack>
		</Card>
	);
}

function _VisibilityAndPermissions(props: {
	form: UseFormReturnType<UserModFormValues>;
}) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Visibility & Permissions
				</Text>
				<Select
					label={"Visibility"}
					{...props.form.getInputProps("visibility")}
					data={data.visibilities}
				/>
			</Stack>
		</Card>
	);
}

function _UserModRating(props: { subscriptions: number; rating: number }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Quick Stats
				</Text>
				<Group justify={"space-between"}>
					<Text c={"gray"}>Subscriptions</Text>
					<Text fw={"bold"}>{props.subscriptions}</Text>
				</Group>
				<Group justify={"space-between"}>
					<Text c={"gray"}>Average Rating</Text>
					<Group gap={"xs"}>
						<Text fw={"bold"}>{props.rating}</Text>
						<Rating readOnly value={props.rating} />
					</Group>
				</Group>
			</Stack>
		</Card>
	);
}

function _FormActions(props: {
	form: UseFormReturnType<UserModFormValues>;
	mod: ModData;
}) {
	const nav = useNavigate();
	const userMods = useGetUserMods();

	const handleDiscard = () => {
		openConfirmModal({
			title: "Discard Changes",
			children: (
				<Text>
					Are you sure you want to discard all changes? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Discard", cancel: "Cancel" },
			onCancel: modals.closeAll,
			onConfirm: () => {
				nav("/user-mods");
			},
		});
	};

	const handleDelete = async () => {
		openConfirmModal({
			title: "Confirm Deletion",
			children: (
				<Text>
					Are you sure you want to delete this mod? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: modals.closeAll,
			onConfirm: async () => {
				await deleteUserMod(props.mod.id);
				await userMods.refetch();
				showSuccessNotification(
					"Mod deleted successfully!",
					"Your mod has been deleted.",
				);
				nav("/user-mods");
			},
		});
	};

	return (
		<Card withBorder>
			<Stack>
				<Button type="submit">Save Changes</Button>
				<Button variant={"default"} onClick={handleDiscard}>
					Discard Changes
				</Button>
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					Delete Mod
				</Button>
			</Stack>
		</Card>
	);
}
