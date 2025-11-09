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
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { StatusCodes } from "http-status-codes";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaCamera } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { data, ModCategory, ModVisibility } from "../../../common/data.ts";
import {
	type AuthenticatedUser,
	type UserMod,
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
	category: z.enum(ModCategory),
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
	visibility: z.enum(ModVisibility),
});
export type UserModFormValues = z.infer<typeof userModFormValues>;

export function UserModPage(props: { user: AuthenticatedUser }) {
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
	user: AuthenticatedUser;
	mod: UserMod;
};

function _UserModPage(props: UserModPageProps) {
	const userMods = useGetUserMods();
	const mod = useGetUserModById(props.mod.id);

	const colorScheme = useComputedColorScheme();

	const form = useForm<UserModFormValues>({
		initialValues: props.mod,
		validate: zod4Resolver(userModFormValues),
	});

	const handleFileChange = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			form.setFieldValue("thumbnail", uploadedImageUrl);
		}
	};

	const handleNewScreenshot = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			form.setFieldValue("screenshots", [
				...form.values.screenshots,
				uploadedImageUrl,
			]);
		}
	};

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"} p={"md"}>
				<form
					onSubmit={form.onSubmit(async (values) => {
						try {
							const res = await updateUserMod(props.mod.id, {
								category: values.category,
								content: values.content,
								dependencies: values.dependencies,
								description: values.description,
								imageUrl: values.thumbnail,
								maintainers: [props.user.id],
								name: values.name,
								screenshots: values.screenshots,
								tags: values.tags,
								thumbnail: values.thumbnail,
								visibility: values.visibility,
							});
							if (res.status !== StatusCodes.OK) {
								throw new Error(
									`Error updating user mod with status code ${res.status}`,
								);
							}
							await mod.refetch();
							await userMods.refetch();
							showSuccessNotification(
								"Mod updated successfully!",
								"Your mod has been updated.",
							);
						} catch (e) {
							showErrorNotification(e);
						}
					})}
				>
					<Flex gap={"md"}>
						<Stack flex={"auto"} gap={"lg"}>
							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Basic Information
									</Text>
									<TextInput label="Mod Name" {...form.getInputProps("name")} />
									<Select
										label={"Category"}
										data={data.categories}
										{...form.getInputProps("category")}
									/>
									<TextInput
										label="Short Description"
										{...form.getInputProps("description")}
									/>
								</Stack>
							</Card>
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
												value={form.values.content}
												onChange={(v) => form.setFieldValue("content", v)}
											/>
										</Tabs.Panel>
										<Tabs.Panel value="preview">
											<Card withBorder my={"md"}>
												<Markdown content={form.values.content} />
											</Card>
										</Tabs.Panel>
									</Tabs>
								</Stack>
							</Card>
							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Tags
									</Text>

									<AppTagsInput
										value={form.values.tags}
										onChange={(v) => form.setFieldValue("tags", v)}
									/>
								</Stack>
							</Card>
							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Dependencies
									</Text>

									<AppDependenciesInput
										value={form.values.dependencies}
										onChange={(v) => form.setFieldValue("dependencies", v)}
									/>
								</Stack>
							</Card>

							<Button type="submit">Save Changes</Button>
						</Stack>
						<Stack>
							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Thumbnail
									</Text>
									<ModImage src={form.values.thumbnail} w={300} radius={5} />
									<FileButton
										onChange={handleFileChange}
										accept="image/png,image/jpeg"
									>
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

							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Screenshots
									</Text>
									<SimpleGrid cols={2}>
										{form.values.screenshots.map((screenshot) => (
											<Image
												key={screenshot}
												h={150}
												radius={"md"}
												src={screenshot}
											/>
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

							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Visibility & Permissions
									</Text>
									<Select
										label={"Visibility"}
										{...form.getInputProps("visibility")}
										data={data.visibilities}
									/>
								</Stack>
							</Card>

							<Card withBorder>
								<Stack>
									<Text size={"lg"} fw={"bold"}>
										Quick Stats
									</Text>
									<Group justify={"space-between"}>
										<Text c={"gray"}>Subscriptions</Text>
										<Text fw={"bold"}>300</Text>
									</Group>
									<Group justify={"space-between"}>
										<Text c={"gray"}>Average Rating</Text>
										<Group gap={"xs"}>
											<Text fw={"bold"}>4.8</Text>
											<Rating readOnly value={4.8} />
										</Group>
									</Group>
								</Stack>
							</Card>
						</Stack>
					</Flex>
				</form>
			</Container>
		</AppShell.Main>
	);
}
